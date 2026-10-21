#!/usr/bin/env node

import fs from "node:fs";

/**
 * Chrome User Experience Report (CrUX) API Fetcher
 *
 * Usage:
 *   CRUX_API_KEY=your_key node scripts/fetch-crux.mjs [origin]
 * Default origin: https://woohannah.com
 */

const ORIGIN = process.argv[2] || "https://woohannah.com";
const API_KEY = process.env.CRUX_API_KEY;

function appendSummary(markdown) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    try {
      fs.appendFileSync(summaryPath, markdown + "\n", "utf8");
    } catch {
      // ignore
    }
  }
}

if (!API_KEY) {
  console.log("\n=======================================================");
  console.log("  Chrome User Experience Report (CrUX) Checker");
  console.log("=======================================================\n");
  console.warn("⚠️  경고: CRUX_API_KEY 환경변수가 설정되지 않았습니다.");
  console.log("CrUX API를 호출하려면 Google Cloud Console에서 API 키가 필요합니다.");
  console.log("1. https://console.cloud.google.com/apis/credentials 접속");
  console.log("2. 'Chrome UX Report API' 활성화 후 API 키 생성");
  console.log("3. 실행 예시:");
  console.log(`   CRUX_API_KEY=your_key node scripts/fetch-crux.mjs ${ORIGIN}\n`);

  appendSummary(`### ⚠️ CrUX API Key 누락
GitHub Secrets에 \`CRUX_API_KEY\`가 설정되지 않았습니다. Google Cloud Console에서 API 키를 발급받아 설정해주세요.`);

  process.exit(1);
}

const endpoint = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${API_KEY}`;

async function checkCrux() {
  console.log(`\n🔍 CrUX 데이터 조회 중: ${ORIGIN} ...`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: ORIGIN,
        formFactor: "ALL_FORM_FACTORS",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error?.code === 404) {
        console.log("\nℹ️  [데이터 없음 (Not Found)]");
        console.log(`현재 ${ORIGIN} 도메인은 Chrome 사용자 트래픽 기준(Eligibility threshold)을`);
        console.log("충족하지 않아 CrUX 공용 데이터 세트에 아직 집계되지 않았습니다.");
        console.log("\n💡 해결 방안:");
        console.log("- 1번(RUM)으로 설치한 web-vitals 라이브러리가 실시간으로 모든 방문자의 지표를 GA4에 기록 중입니다.");
        console.log("- 사이트 트래픽이 증가하고 구글 검색 인덱싱이 유지되면 약 28일 주기로 CrUX에 자동 등록됩니다.");

        appendSummary(`### ℹ️ CrUX 데이터 수집 대기 중 (\`${ORIGIN}\`)
- **상태**: 현재 도메인은 Chrome 사용자 최소 트래픽 요건을 집계 중입니다.
- **RUM 연동 상태**: 클라이언트에 설치된 \`web-vitals\` 라이브러리가 방문자의 모든 Core Web Vitals 데이터를 실시간으로 GA4에 기록하고 있습니다.`);
        return;
      }
      console.error(`\n❌ API 오류 (${data.error?.code}):`, data.error?.message);
      appendSummary(`### ❌ CrUX API 오류
- 상태 코드: \`${data.error?.code}\`
- 메시지: ${data.error?.message}`);
      return;
    }

    const metrics = data.record?.metrics;
    if (!metrics) {
      console.log("기록된 지표가 없습니다.");
      return;
    }

    console.log("\n=======================================================");
    console.log(`📊 CrUX Core Web Vitals 요약 (${ORIGIN})`);
    console.log("=======================================================");

    const targetMetrics = [
      { key: "largest_contentful_paint", name: "LCP (최대 콘텐츠 렌더링)", code: "LCP", unit: "ms", goodMax: 2500, poorMin: 4000 },
      { key: "interaction_to_next_paint", name: "INP (다음 페인트와의 상호작용)", code: "INP", unit: "ms", goodMax: 200, poorMin: 500 },
      { key: "cumulative_layout_shift", name: "CLS (누적 레이아웃 이동)", code: "CLS", unit: "", goodMax: 0.1, poorMin: 0.25 },
      { key: "first_contentful_paint", name: "FCP (최초 콘텐츠 렌더링)", code: "FCP", unit: "ms", goodMax: 1800, poorMin: 3000 },
      { key: "experimental_time_to_first_byte", name: "TTFB (첫 바이트 시간)", code: "TTFB", unit: "ms", goodMax: 800, poorMin: 1800 },
    ];

    let summaryRows = [];

    for (const item of targetMetrics) {
      const metric = metrics[item.key];
      if (!metric) continue;

      const p75 = metric.percentiles?.p75;
      const goodFraction = ((metric.histogram?.[0]?.density || 0) * 100).toFixed(1);
      const needsImprovementFraction = ((metric.histogram?.[1]?.density || 0) * 100).toFixed(1);
      const poorFraction = ((metric.histogram?.[2]?.density || 0) * 100).toFixed(1);

      let status = "🟢 Good";
      if (item.unit === "") {
        const val = parseFloat(p75);
        if (val > item.poorMin) status = "🔴 Poor";
        else if (val > item.goodMax) status = "🟡 Needs Improvement";
      } else {
        const val = Number(p75);
        if (val > item.poorMin) status = "🔴 Poor";
        else if (val > item.goodMax) status = "🟡 Needs Improvement";
      }

      console.log(`\n• ${item.name}`);
      console.log(`  - 75th 백분위수 (p75): ${p75}${item.unit} [${status}]`);
      console.log(`  - 비율 분포: Good: ${goodFraction}% | 개선 필요: ${needsImprovementFraction}% | Poor: ${poorFraction}%`);

      summaryRows.push(`| **${item.code}** | ${item.name} | **${p75}${item.unit}** | ${status} | ${goodFraction}% | ${needsImprovementFraction}% | ${poorFraction}% |`);
    }

    console.log("\n=======================================================\n");

    if (summaryRows.length > 0) {
      appendSummary(`### 📊 CrUX Performance Report (\`${ORIGIN}\`)

| 지표 | 설명 | 75th 백분위수 (p75) | 등급 | Good | Needs Improvement | Poor |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${summaryRows.join("\n")}
`);
    }
  } catch (error) {
    console.error("CrUX 데이터 요청 중 오류 발생:", error);
    appendSummary(`### ❌ 요청 실패: ${error.message}`);
  }
}

checkCrux();
