# 웹 성능 및 CrUX(Chrome User Experience Report) 모니터링 가이드

본 문서는 `woohannah.com` 웹사이트의 실제 사용자 환경 성능(Core Web Vitals)을 측정하고 모니터링하기 위해 구축된 3단계 시스템의 설정 및 활용 가이드입니다.

---

## 1. 실시간 RUM (Real User Monitoring) - 클라이언트 측정

방문자 수나 트래픽 규모에 관계없이 사이트에 접속하는 모든 사용자의 실제 브라우저 성능 지표를 수집합니다.

- **관측 라이브러리**: Google 공식 `web-vitals` v4
- **연동 코드 위치**: [`src/scripts/web-vitals.ts`](src/scripts/web-vitals.ts) 및 [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro)
- **수집 지표**:
  - `LCP` (Largest Contentful Paint, 최대 콘텐츠 렌더링 시간)
  - `INP` (Interaction to Next Paint, 사용자 입력 반응 지연 시간)
  - `CLS` (Cumulative Layout Shift, 누적 레이아웃 이동)
  - `FCP` (First Contentful Paint, 최초 콘텐츠 렌더링 시간)
  - `TTFB` (Time to First Byte, 서버 첫 응답 시간)

### Google Analytics 4 (GA4)에서 데이터 확인하는 법
1. [Google Analytics 콘솔](https://analytics.google.com/) 접속
2. **보고서** > **실시간** 접속 후 `이벤트 수(이벤트 이름별)` 카드 확인
3. 사이트 방문 시 `LCP`, `INP`, `CLS` 등의 이벤트가 실시간으로 수신되는지 확인
4. **보고서** > **참여도** > **이벤트**에서 누적된 지표별 평균값 및 분포 확인 가능

---

## 2. 구글 공식 CrUX 대시보드 & Search Console

구글이 수집한 크롬 사용자 실제 환경 집계 데이터(28일 이동평균)를 시각화하는 공식 채널입니다.

### ① Looker Studio CrUX 공식 대시보드 (원클릭 생성)
- **대시보드 바로가기 링크**: [Looker Studio CrUX 대시보드 열기](https://lookerstudio.google.com/c/reporting/create?c.reportId=chrome-ux-report&ds.ds0.datasourceName=CrUX&ds.ds0.origin=https%3A%2F%2Fwoohannah.com)
- **생성 방법**:
  1. 위 링크를 클릭하면 `woohannah.com`이 입력된 상태로 대시보드 템플릿이 로드됩니다.
  2. 우측 상단의 **[보고서 만들기]** 버튼을 클릭합니다.
  3. 지난 수개월 간의 Core Web Vitals 추이(데스크톱 vs 모바일, 4G vs Wi-Fi)가 자동으로 차트화됩니다.

### ② Google Search Console (SEO 랭킹 반영 여부)
- [Google Search Console](https://search.google.com/search-console) 접속
- 좌측 메뉴의 **[웹 탐색 환경]** > **[Core Web Vitals (웹 핵심 지표)]** 선택
- 모바일 및 데스크톱별 '양호 / 개선 필요 / 느림' URL 현황 확인

### ③ PageSpeed Insights 즉시 진단
- [PageSpeed Insights (woohannah.com)](https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwoohannah.com) 접속
- 페이지 상단: 실제 사용자 환경 데이터 (CrUX)
- 페이지 하단: 시뮬레이션 환경 진단 (Lighthouse 점수 및 개선 제안)

---

## 3. CrUX API 모니터링 자동화 (CLI & GitHub Actions)

### 로컬 터미널에서 실행
```bash
# 1. API 키 설정 (Google Cloud Console에서 발급)
export CRUX_API_KEY="your_api_key_here"

# 2. 검사 실행
npm run crux
# 또는 yarn crux
```

### GitHub Actions 정기 모니터링
- 워크플로 파일: [`.github/workflows/crux-monitor.yml`](.github/workflows/crux-monitor.yml)
- **실행 주기**: 매주 월요일 09:00 KST 자동 실행 + GitHub 웹에서 언제든 수동 실행 가능
- **GitHub Secrets 설정**:
  1. GitHub 저장소 > **Settings** > **Secrets and variables** > **Actions**
  2. **New repository secret** 클릭
  3. Name: `CRUX_API_KEY`
  4. Value: Google Cloud Console에서 발급받은 API 키 저장
