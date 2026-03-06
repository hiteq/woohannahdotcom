# woohannah.com

우한나 작가 포트폴리오 웹사이트

## 기술 스택

- **프레임워크**: [Astro](https://astro.build/) (SSG)
- **스타일링**: Tailwind CSS v4
- **콘텐츠**: Obsidian에서 작성한 Markdown 파일 (`content/` 디렉토리)
- **호스팅**: GitHub Pages (커스텀 도메인: `woohannah.com`)
- **배포**: `main` 브랜치에 push하면 GitHub Actions가 자동 빌드 & 배포

---

## 로컬 개발

```bash
# 의존성 설치
yarn install

# 개발 서버 (http://localhost:4321)
yarn dev

# 프로덕션 빌드
yarn build
```

---

## 콘텐츠 구조

```
content/
├── About.md              # About 페이지
├── Exhibitions/          # 전시 (type: exhibition)
├── Works/                # 작품 (type: work)
│   ├── Sculptures/
│   ├── Installations/
│   └── Drawings/
├── Thoughts/             # 비평/인터뷰/작가노트 (type: thought)
├── Press/                # 프레스
└── Images/               # 이미지 에셋
```

### Frontmatter 주요 속성

| 속성 | 설명 | 예시 |
|------|------|------|
| `title` | 제목 | `"2025, POOMSAE"` |
| `date` 또는 `Date` | 날짜 (정렬 기준) | `"2025-08-12"` |
| `type` | 콘텐츠 종류 | `work`, `exhibition`, `thought`, `page` |
| `category` | 카테고리 | `"Solo"`, `"Group"` |
| `series` | 시리즈 그룹 (Works 전용) | `"Bag with you"` |
| `pinned` | 목록 최상단 고정 | `true` |
| `Year` | 작품 제작 연도 | `"2025"` |

---

## 배포 관련 주의사항

### ⚠️ GitHub Pages 설정 (중요!)

GitHub Pages가 작동하려면 **리포지토리 설정이 올바르게 유지**되어야 합니다.

1. **리포지토리를 public으로 유지할 것**
   - Private 리포에서는 무료 플랜으로 GitHub Pages를 사용할 수 없음
   - Private으로 전환하면 Pages가 비활성화되어 사이트가 **404** 발생

2. **Pages 소스 = GitHub Actions**
   - Settings → Pages → Source가 **GitHub Actions**로 설정되어 있어야 함
   - `deploy.yml` 워크플로우가 `main` 브랜치 push 시 자동 빌드/배포

3. **커스텀 도메인 설정**
   - Settings → Pages → Custom domain에 `woohannah.com` 입력
   - DNS에 GitHub Pages용 CNAME 또는 A 레코드 필요

### 404가 발생하는 경우 체크리스트

1. 리포가 **private**으로 바뀌지 않았는지 확인
2. Settings → Pages에서 Source가 **GitHub Actions**인지 확인
3. Actions 탭에서 최근 **Deploy to GitHub Pages** 워크플로우가 성공(✓)했는지 확인
4. 수동 재배포: Actions → Deploy to GitHub Pages → Run workflow → `main` 브랜치 선택 → 실행

### 프리뷰 배포 (Vercel)

코드 변경사항을 운영 반영 전에 클라이언트에게 미리 보여주고 싶을 때:

```bash
# fix 브랜치에서 작업 후 Vercel로 프리뷰
npx vercel deploy --yes

# 프리뷰 URL이 생성되면 클라이언트에게 공유
# 예: https://woohannahdotcom-xxxxx.vercel.app
```

---

## 브랜치 전략

- `main`: 운영 배포 브랜치 (push 시 자동으로 GitHub Pages 배포)
- `fix/*`: 수정 작업용 브랜치 → 확인 후 `main`에 머지
