# Draft: Tailwind version check (UI)

## User question
- "UI들이 tw v4로되어있나?" (Is the UI using Tailwind v4?)

## Findings (repo)
- `package.json` shows `tailwindcss: ^3.4.17` (devDependency) → **Tailwind v3**, not v4.
- Tailwind integration: `@astrojs/tailwind: 6.0.2`.
- Config files present:
  - `tailwind.config.mjs`
  - `postcss.config.cjs`

## Integration map (confirmed)
- `astro.config.mjs` uses `integrations: [tailwind()]` (Astro Tailwind integration).
- `src/styles/globals.css`
  - has `@tailwind base/components/utilities`
  - uses `@layer base` + `@apply` (e.g., `body`, `a`, and `.prose figure...`)
- Tailwind typography plugin is included in `tailwind.config.mjs` via `@tailwindcss/typography`.

## Test/QA infra (confirmed)
- Unit tests: `vitest run` (see `package.json`), tests live under `tests/*.test.ts`.
- No existing E2E/visual regression framework detected in repo yet (would be added if we choose Playwright smoke+screenshots).

## Decisions (user)
- Goal: **Same UI 유지** (visual/layout changes minimized).
- Verification preference: **Playwright smoke + screenshots**.
 - Smoke coverage: **핵심+콘텐츠 6~8개 라우트**.
 - Playwright dependency: **레포에 devDependency로 추가 OK**.
 - Screenshot strictness: **소량 변화 허용(허용치 설정)**.
 - Screenshot data source: **레포에 포함된 콘텐츠 사용**.
 - Playwright runs: **CI에서도 실행**.
 - Route selection: **자동 탐색 후 6~8개 고정 목록**.
 - Screenshot baseline: **레포에 커밋**.
 - Viewports: **3개 이상**.
 - Upgrade scope: **전반 업데이트(의존성도 최신으로)**.

## Open questions (need answers before plan)
- Which routes/pages should be included in Playwright smoke + screenshot baseline? (target: 6~8)
- Screenshot stability: 콘텐츠/데이터가 CI에서도 동일하게 재현되는가? (sync-content 의존 여부)
- CI environment: GitHub Actions 등에서 Playwright 실행할지, 로컬에서만 실행할지
- Tailwind v4 마이그레이션 범위: PostCSS 플러그인(@tailwindcss/postcss)로 전환 포함 여부, 관련 플러그인(@tailwindcss/typography) 버전 업데이트 포함 여부

## Open question
- Do you want a plan to **upgrade Tailwind v3 → v4** (and adjust configs/classes/plugins as needed)?

## Decision (user)
- User wants: **Tailwind v4 upgrade plan**.
