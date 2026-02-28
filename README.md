# LimJhyeok's Personal Blog

AI Engineer의 개인 블로그입니다. 프로젝트, 개발 글, 월별 회고를 공유합니다.

## 기능

- **Light Mode 미니멀 디자인**: 깔끔한 단일 페이지 인터페이스
- **마크다운 기반**: `content/posts/`에 파일 추가만으로 글 게시
- **LaTeX 수식 지원**: KaTeX로 인라인/블록 수식 렌더링
- **조회수 추적**: 오늘 / 어제 / 누적 조회수
- **카테고리 필터링**: Project, Dev, Retro
- **소셜 링크**: GitHub · LinkedIn 아이콘 (환경 변수로 설정)

## 폴더 구조

```
.
├── api/
│   ├── index.js          # Express 백엔드 (라우팅, CORS, 레이트 리밋)
│   └── lib/
│       ├── kv.js         # KV 추상화: 로컬 MemoryKV / 프로덕션 Vercel KV
│       ├── posts.js      # getAllPosts(), getPost(id) — content/posts/ 읽기
│       └── frontmatter.js
├── content/
│   └── posts/            # 블로그 글 (YYYY-MM-DD-slug.md)
├── public/
│   ├── index.html
│   ├── styles/main.css
│   └── scripts/app.js
├── .github/workflows/ci.yml
├── .env.example
└── vercel.json
```

## 글 작성

`content/posts/YYYY-MM-DD-slug.md` 형식으로 파일 생성:

```markdown
---
title: "글 제목"
date: 2025-03-01
category: dev
tags: ["tag1", "tag2"]
summary: "선택 사항. 설정하면 목록 뷰에서 이 텍스트를 미리보기로 사용합니다."
---

본문 내용...

인라인 수식: $E = mc^2$

블록 수식:
$$
\int_0^\infty e^{-x}\,dx = 1
$$
```

**category** 값은 `index.html`의 `data-filter` 속성과 정확히 일치해야 합니다 (`project` / `dev` / `retro`).

`summary`를 생략하면 본문 앞 160자를 자동 생성합니다.

## 설치 및 실행

```bash
npm install
npm run dev    # http://localhost:3000
```

## Vercel 배포

### 1. Vercel KV 설정

1. [Vercel Dashboard](https://vercel.com/dashboard)에서 프로젝트 생성
2. Storage → KV 추가 후 생성된 환경 변수 복사

### 2. 환경 변수

프로젝트 Settings → Environment Variables에서 설정 (`.env.example` 참고):

| 변수 | 설명 |
|---|---|
| `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN` | Vercel KV 연결 정보 |
| `ADMIN_PASSWORD` | 미래 관리 기능용 (현재 필수 아님) |
| `ALLOWED_ORIGINS` | CORS 허용 출처 (콤마 구분, 예: `https://your-blog.vercel.app`) |
| `GITHUB_URL` | GitHub 프로필 URL |
| `LINKEDIN_URL` | LinkedIn 프로필 URL |

### 3. 배포

```bash
git push origin main  # push하면 Vercel이 자동 배포
```

## API

```
GET  /api/posts               글 목록 (메타데이터 + excerpt)
GET  /api/posts/:id           글 상세 (meta + content)
POST /api/analytics/view      조회수 기록 (30회/분 레이트 리밋)
GET  /api/analytics/:post_id  조회수 조회 → { today, yesterday, total }
GET  /api/profile             소셜 링크 → { github, linkedin }
```

## 커스터마이징

**블로그 정보**: `public/index.html`에서 이름과 tagline 수정

**색상**: `public/styles/main.css` CSS 변수 수정

```css
:root {
    --accent-color: #0066cc;  /* 포인트 색상 */
}
```

**소셜 링크**: 환경 변수 `GITHUB_URL`, `LINKEDIN_URL` 설정 (미설정 시 아이콘 클릭 → 툴팁 표시)

## 기술 스택

- **Frontend**: HTML / CSS / JavaScript, marked.js, KaTeX
- **Backend**: Node.js, Express
- **Storage**: Vercel KV (Redis) — 로컬은 in-memory
- **Hosting**: Vercel
- **CI**: GitHub Actions (ESLint + Stylelint + `npm audit`)

## 라이선스

MIT License
