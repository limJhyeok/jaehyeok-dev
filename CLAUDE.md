# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start local dev server → http://localhost:3000
```

No build step, no test runner. The dev server serves both the API and static frontend.

## Architecture

This is a single-page blog with a Node.js/Express backend deployed on Vercel.

```
api/
  index.js          # Express app — all API routes, CORS, rate limiting
  lib/
    kv.js           # KV abstraction: MemoryKV (local) / @vercel/kv (prod)
    posts.js        # getAllPosts(), getPost(id) — reads content/posts/*.md
    frontmatter.js  # parseFrontmatter(raw) → { meta, content }
content/
  posts/            # blog post markdown files (YYYY-MM-DD-slug.md)
public/
  index.html        # single HTML shell — no routing, just two views
  scripts/app.js    # all frontend logic (view switching, markdown, KaTeX)
  styles/main.css   # CSS variables + component styles
```

### Two-view SPA pattern

There is no client-side router. The frontend toggles between two views:
- **List view**: `.posts-section` visible, `#post-detail` hidden
- **Detail view**: `.posts-section.hidden`, `#post-detail.active`

`showPostDetail(postId, refresh=false)` drives the transition. Pass `refresh=true` to skip `recordView()` (e.g. after comment submit).

### Post loading flow

1. `loadPosts()` → `GET /api/posts` → `getAllPosts()` reads `content/posts/*.md`, parses frontmatter, returns metadata + excerpt
2. Clicking a post → `showPostDetail(id)` → `GET /api/posts/:id` → `getPost(id)` returns `{ meta, content }` (already parsed)
3. Frontend renders markdown via `marked.parse()`, then calls `renderMathInElement()` for KaTeX

### KV (storage)

`api/lib/kv.js` checks `process.env.VERCEL === '1'`:
- **Local**: in-memory `MemoryKV` (data lost on restart, no setup needed)
- **Production**: `@vercel/kv` (Redis, requires env vars)

KV keys: `views:{post_id}:{YYYY-MM-DD}`, `views:{post_id}:total`, `comments:{post_id}`

### Post frontmatter

```markdown
---
title: "글 제목"
date: 2025-03-01
category: dev        # used for nav filter (All/Project/Dev/Retro)
tags: ["tag1", "tag2"]
summary: "Optional. If set, used as excerpt in list view instead of auto-generated."
---
```

`category` value must match the `data-filter` attribute in `index.html` nav exactly (case-sensitive).

### Security decisions made

- `escapeHtml()` in `app.js` — applied to all user-supplied comment fields before innerHTML insertion
- Admin password: guarded with `!!process.env.ADMIN_PASSWORD &&` to prevent bypass when env var is unset
- CORS: `ALLOWED_ORIGINS` env var (comma-separated); always allows `http://localhost:3000` in dev — **set `ALLOWED_ORIGINS` in Vercel before deploying**
- Rate limiting: `express-rate-limit` on POST `/api/analytics/view` (30/min) and POST `/api/comments` (5/min)

### Environment variables

See `.env.example`. Required for production:
- `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN` — Vercel KV
- `ADMIN_PASSWORD` — comment admin auth
- `ALLOWED_ORIGINS` — CORS whitelist (e.g. `https://your-blog.vercel.app`)
