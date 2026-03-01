---
title: "Claude Code 디버깅 전략 따라가기"
date: 2026-03-01
category: dev
summary: Claude Code의 Debugging 과정을 따라가면서 AI Agentic Coding 시대에 개발자는 어떤 디버깅 전략을 구사해야하는지
tags: ["디버깅", "개발자"]
---
<a href="https://github.com/limJhyeok/jhyeok-dev/commit/eb3caa40fed806367db7053d5b7f0a29dd25c932" target="_blank" style="text-decoration:none;">
  <div style="
      border:1px solid #e1e4e8;
      border-radius:10px;
      padding:16px;
      transition:0.2s;
  ">
    <strong>🔗 이슈를 해결한 실제 커밋 보기</strong><br/>
    문제 원인 분석과 수정 내역을 확인할 수 있습니다<br/>
  </div>
</a>

> Claude Code의 Debugging 과정을 따라가면서 AI Agentic Coding 시대에 개발자는 어떤 디버깅 전략을 구사해야하는지

## 1. 문제 상황과 배경

최근 개인 블로그를 자체 구축하고 **Vercel**에 배포를 했었습니다.

Vercel은 처음 사용하는 플랫폼이라, 배포 과정에서 Claude Code와 챗봇에게 여러 번 도움을 요청하며 겨우 배포를 완료했지만, 세부적인 설정이나 디버깅 방법은 제대로 알지 못했습니다.

보통 저같은 경우 디버깅이라면

- 특정 위치에 **breaking point**를 찍어 세세히 확인하거나
- breaking point 설정이 어려울 경우 서버 환경에서 직접 shell로 코드를 실행하며 로그 확인

같은 접근 방법을 사용했지만, **Vercel 서버리스 환경**에서는 이런 방법이 제한적으로 보입니다.

Claude Code 역시 이 과정에서 여러 차례 헤매는 모습을 보였습니다.

이 과정에서 Claude Code가 프로젝트 내 **민감한 환경변수(.env)** 파일을 읽거나 Vercel CLI로 배포 환경변수를 확인하는 작업도 진행이 되었습니다.

개인 블로그라 큰 문제가 없었지만, 실제 운영 서비스였다면 환경변수 접근 권한을 허락하지 않았을 것입니다.


## 2. 배포 과정에서 마주한 핵심 문제

문제가 발생한 계기는 **조회수 API를 개발하고 Vercel KV(Storage)에 연결하는 과정**에서였습니다.

조회수 기능은 정적 파일만으로는 카운팅이 불가능하고, 반드시 상태를 저장할 수 있는 데이터베이스가 필요합니다. 다행히 Vercel은 KV를 무료로 일정량 제공하고, 이를 프로젝트와 연결해 사용할 수 있습니다.

하지만 프로젝트와 KV를 연결했음에도 조회수 기능이 정상 작동하지 않았습니다.

이 과정에서 여러 번 삽질을 하다 보니, 작성한 블로그 글이 없어지는 버그까지 발생하는 상황도 경험했습니다.

이번 경험에서 핵심적으로 문제가 되었던 부분은 크게 두 가지였습니다.

### 2-1. **ENV 변수 관련 문제**

CORS 설정을 ENV 파일에 `https://your-blog.vercel.app`로 지정해야 했지만, 실수로 마지막에 슬래시(`/`)가 붙은 `https://your-blog.vercel.app/`로 설정했습니다.

ENV 변수에 https://your-blog.vercel.app/처럼 trailing slash가 포함된 값을 설정한 것이 문제였습니다.

**CORS 검증 실패**
브라우저의 Origin 헤더는 trailing slash가 없는
https://your-blog.vercel.app 형태로 전송되는데,
서버는 slash가 포함된 문자열과 정확히 일치하는지만 비교하기 때문에 CORS가 통과되지 않았습니다.

바보같은 실수지만, 배포 과정에서 문제는 늘 이렇게 사소해보이는 부분에서 시작되더군요…ㅎㅎ

### 2-2. **Vercel 배포 환경 특수성**

Vercel은 `/api/*.js` 파일이 존재하더라도, **빌드 설정이 올바르지 않으면 API 라우트가 만들어지지 않고 Static Hosting으로만 배포**됩니다.

초기에 Claude Code가 `vercel.json`을 작성해 API 라우트를 설정했지만, 배포 로그에 다음과 같은 경고가 반복적으로 떴습니다.

```bash
WARN! Due to `builds` existing in your configuration file,
the Build and Development Settings defined in your Project Settings will not apply.
Learn More: https://vercel.link/unused-build-settings
```

즉, **vercel.json에 `builds`가 존재하면 Vercel 대시보드에서 설정한 빌드 옵션과 개발 환경 설정이 무시된다**는 의미입니다.

저는 이 경고를 자세히 확인하지 않고, 단순히 warning을 없애기 위해 `vercel.json`을 임시로 삭제했는데, 그 결과 API 라우트가 배포되지 않아 조회수 기능 bug 뿐 아니라 blog글 목록 자체를 못가져오는 bug로 번지게 되었습니다. 이 역시 멍청한 실수였습니다…

## 3. Claude Code의 디버깅 전략

그러면 Claude Code는 이러한 버그를 어떻게 찾고 고쳤는지, 그 흐름을 따라가 보겠습니다.

Claude Code는 단순히 에러 메시지를 확인하는 데 그치지 않고, **배포 환경에서 흔히 깨지는 4개 레이어를 순차적으로 점검**했습니다.

### 🔎 3-1. 전체 전략 구조 (Top-Down Isolation)

```
[1] 코드/로직 문제인가?          → 코드 읽기로 검증
[2] 요청이 서버에 도달하는가?     → curl + Vercel 라우팅 검증
[3] 서버가 올바르게 응답하는가?   → 환경 변수 / CORS 검증
[4] 브라우저에서도 동작하는가?    → Playwright로 E2E 검증
```

"조회수 API가 안 된다"라는 증상을 곧바로 KV(storage) 문제로 단정하지 않고, **Code → Routing → Config → Browser** 순으로 원인을 좁혀 갔습니다. 이것은 프로덕션 장애를 진단할 때 사용하는 전형적인 Top-Down Isolation 패턴과 동일합니다.



### 🧠 3-2. 단계별 접근 방법

### Step 1. 코드 읽기 — 코드/로직 문제인가?

```bash
[Read] kv.js
[Read] index.js
[Read] .env.example
```

Claude Code가 가장 먼저 한 일은 코드를 읽는 것이었습니다. 에러 로그부터 보는 것이 아니라, **코드 구조를 먼저 이해하고 가설을 세우는 접근**입니다. 구체적으로 다음 세 가지를 확인했습니다.

**① KV client 생성 방식**

```jsx
// kv.js
let kv;

if (isProd) {
  const { Redis } = await import('@upstash/redis');
  kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
} else {
  console.log('Using Memory KV (local dev)');
  kv = new MemoryKV();
}

export { kv };
```

→ Production에서는 Upstash Redis를 사용하고, 로컬에서는 메모리 기반 KV를 쓰는 구조. 환경 변수 `KV_REST_API_URL`과 `KV_REST_API_TOKEN`이 production에 반드시 존재해야 한다는 점을 파악합니다.

**② 환경 변수 파일**

```
# .env.example
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

→ 필요한 환경 변수 목록과 네이밍 컨벤션을 확인합니다.

**③ 조회수 API endpoint 구조** (`/api/analytics/view`)

```jsx
// 조회수 기록 (POST)
app.post('/api/analytics/view', analyticsLimiter, async (req, res) => {
  try {
    const { post_id } = req.body;
    if (!post_id) {
      return res.status(400).json({ error: 'post_id required' });
    }
    const today = new Date().toISOString().split('T')[0];
    const key = `views:${post_id}:${today}`;
    await kv.incr(key);
    await kv.incr(`views:${post_id}:total`);
    res.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to record view' });
  }
});

// 조회수 조회 (GET)
app.get('/api/analytics/:post_id', async (req, res) => {
  try {
    const { post_id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().split('T')[0];

    const todayViews = await kv.get(`views:${post_id}:${today}`) || 0;
    const yesterdayViews = await kv.get(`views:${post_id}:${yesterday}`) || 0;
    const totalViews = await kv.get(`views:${post_id}:total`) || 0;

    res.json({
      post_id,
      today: parseInt(todayViews),
      yesterday: parseInt(yesterdayViews),
      total: parseInt(totalViews)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});
```

**🔍 판단 근거: 코드/로직에는 문제 없음**

| 검증 항목 | 결과 | 판단 이유 |
| --- | --- | --- |
| API 핸들러 로직 | ✅ 정상 | `post_id` 검증 → KV incr → JSON 응답, 표준적인 CRUD 패턴 |
| KV client 생성 | ✅ 정상 | `isProd` 분기가 명확하고, env 변수명이 `.env.example`과 일치 |
| 에러 핸들링 | ✅ 정상 | try-catch로 감싸져 있고, 실패 시 500 + 에러 메시지 반환 |
| 경로 패턴 | ✅ 정상 | POST `/api/analytics/view`, GET `/api/analytics/:post_id` — Express 라우팅 문법에 오류 없음 |

코드 자체에 논리적 오류가 없다는 것을 확인했으므로, **문제의 원인이 코드 외부(배포 환경, 설정)에 있을 가능성**을 높게 잡고 다음 단계로 넘어갑니다.

### Step 2. Vercel 환경 변수 확인

```bash
vercel env ls
```

`vercel env ls` 명령으로 Vercel에 등록된 환경 변수의 **존재 여부**와 **Production/Preview scope**를 확인합니다.

| 확인 목적 | 이유 |
| --- | --- |
| ENV가 존재하는가 | Vercel은 preview/production scope가 분리되어 있음 |
| Production에 붙어있는가 | Production 환경의 env 값은 다른 환경과 다른 경우가 많음 |
| env 이름이 코드와 동일한가 | snake_case vs camelCase mismatch가 빈번함 |

**🔍 판단 근거: 환경 변수 존재는 확인, 값은 미검증**

| 검증 항목 | 결과 | 판단 이유 |
| --- | --- | --- |
| `KV_REST_API_URL` 존재 | ✅ 존재 | `vercel env ls` 출력에 Production scope로 등록 확인 |
| `KV_REST_API_TOKEN` 존재 | ✅ 존재 | 동일하게 Production scope 확인 |
| `ALLOWED_ORIGINS` 존재 | ✅ 존재 | Production scope 확인 |
| 각 변수의 **값** 정확성 | ⏸️ 미검증 | `env ls`는 이름과 scope만 보여줌, 실제 값은 확인 불가 |

환경 변수가 "존재한다"는 것과 "올바른 값이 들어있다"는 것은 다릅니다. 이 단계에서는 존재 여부까지만 확인하고 넘어갔는데, 이 미묘한 차이가 나중에 CORS 버그를 찾는 단계에서 다시 등장합니다.

### Step 3. 서버 로그 확인

```bash
vercel logs https://.../api/analytics/view 2>&1 | head -60
```

Serverless 함수가 실제로 실행되는지 검증하는 단계입니다. 여기서 확인하고자 하는 것은 명확한 에러 메시지가 아니라, **함수가 invoke조차 되지 않는 경우**를 걸러내는 것입니다. Serverless 환경에서는 라우팅 설정 오류로 함수가 아예 호출되지 않는 일이 빈번하기 때문에, 이 단계는 "코드 문제 vs 인프라 문제"를 가르는 분기점이 됩니다.

**🔍 판단 근거: 로그만으로는 결론 불가 → 직접 검증으로 전환**

| 검증 항목 | 결과 | 판단 이유 |
| --- | --- | --- |
| 함수 실행 로그 존재 | ⚠️ 불명확 | 로그만으로는 함수가 실행되었는지, 라우팅 단에서 차단된 건지 구분이 어려움 |

로그 확인만으로는 결론을 내리기 어려웠기 때문에, Claude Code는 더 직접적인 검증 방법인 **curl을 통한 HTTP 레벨 테스트**로 넘어갑니다.

### Step 4. curl로 API 직접 호출 — 요청이 서버에 도달하는가?

```bash
curl -s https://....vercel.app/api/health && echo \
&& curl -s https://....vercel.app/api/posts && echo \
&& curl -s "https://....vercel.app/" | head -5
```

브라우저를 거치지 않고, HTTP 레벨에서 직접 API를 때려보는 단계입니다. 이렇게 하면 다음 변수들을 **의도적으로 제거**할 수 있습니다:

- ❌ Browser 렌더링 에러
- ❌ JavaScript 실행 에러
- ❌ CORS 정책 차단

즉, **순수하게 "서버가 요청을 받아서 응답하는가?"만 테스트**하는 것입니다.

**결과:**

```bash
# [결과]: curl -s https://jhyeok-dev.vercel.app/api/health && echo
The page could not be found
NOT_FOUND

# [결과]: curl -s https://....vercel.app/api/posts && echo
The page could not be found
NOT_FOUND

# [결과]: curl -s "https://....vercel.app/" | head -5
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    ...
```

**🔍 판단 근거: 요청이 서버에 도달하지 못하고 있음 — 라우팅 문제 확정**

| 검증 항목 | 결과 | 판단 이유 |
| --- | --- | --- |
| `/` (루트) | ✅ 200 OK | HTML 정상 반환 → static file serving 동작 중 |
| `/api/health` | ❌ 404 | Vercel 자체 404 페이지 반환 → Express 앱이 아닌 **Vercel 라우터**가 거부 |
| `/api/posts` | ❌ 404 | 동일한 Vercel 404 → 특정 endpoint가 아닌 `/api/*` **전체**가 죽어있음 |

핵심 추론: 만약 Express 앱이 실행되었다면 404라도 Express의 에러 메시지(`Cannot GET /api/health`)가 나와야 합니다. 그런데 Vercel의 기본 404 페이지가 나왔다는 것은, **요청이 Express까지 도달하지 못하고 Vercel 라우팅 단에서 차단되고 있다**는 결정적인 증거입니다.

> **Thinking:** "루트 경로 `/`는 200을 반환하는데 `/api/*`만 404다. 이건 static file serving은 정상이지만 API 라우팅 자체가 완전히 깨져 있다는 뜻이다. Express 앱의 문제가 아니라, **요청이 Express까지 도달하지 못하고 있다.**"
> 

Claude Code는 이 추론을 사용자에게 간결하게 전달합니다:

> "`/`는 200인데 `/api/*`만 404네요. 라우팅 자체가 작동 안 하고 있어요. 실제로 함수가 생성된 경로를 확인해볼게요."
> 

### Step 4-1. 추가 curl 테스트로 가설 정밀 검증

Claude Code는 "라우팅이 깨져 있다"는 가설을 더 정밀하게 검증하기 위해 추가 요청을 보냅니다:

```bash
curl -s https://....vercel.app/api/index 2>&1 | head -3
echo "---"
curl -s -X POST https://....vercel.app/api/analytics/view \
  -H "Content-Type: application/json" \
  -d '{"post_id":"test"}' 2>&1
```

**결과:**

```
<!DOCTYPE html>
<html lang="en">
<head>
---
The page could not be found
NOT_FOUND
```

**🔍 판단 근거: API 라우트 규칙이 아예 무시되고, catch-all이 전부 가져감**

| 검증 항목 | 결과 | 판단 이유 |
| --- | --- | --- |
| `/api/index` | ❌ HTML 반환 | Express 앱이 아닌 `index.html`이 반환됨 → catch-all `/(.*) → /public/$1`이 `/api/*`까지 삼킴 |
| POST `/api/analytics/view` | ❌ 404 | Vercel 404 반환 → POST 요청도 동일하게 라우팅 실패 |

`/api/index`가 Express 앱이 아닌 **index.html**을 반환하고 있다는 것은, API 라우트 규칙(`src: "/api/.*"`)이 **아예 매칭되지 않고**, catch-all이 모든 요청을 가져가고 있다는 확정적 증거입니다.

> **Thinking:** "`/api/index`가 HTML을 반환한다? 이건 `src: "/api/.*"` 라우트가 아예 매칭되지 않고, catch-all이 모든 것을 가져가고 있다는 뜻이다. Vercel이 레거시 라우팅 설정을 제대로 해석하지 못하고 있는 것 같다. `.vercel/output` 빌드 결과를 확인해봐야 한다."
> 

### Step 4-2. 빌드 결과물 분석 — 근본 원인 발견

Claude Code는 Vercel이 실제로 생성한 라우팅 설정을 직접 확인합니다:

```bash
vercel pull --yes
vercel build
cat .vercel/output/config.json
```

**결과:**

```json
{
  "version": 3,
  "routes": [
    { "handle": "filesystem" },
    {
      "src": "^/api(/.*)?$",
      "status": 404          // ← 모든 API 경로를 404로 처리!
    },
    { "handle": "error" },
    {
      "status": 404,
      "src": "^(?!/api).*$",
      "dest": "/404.html"
    },
    { "handle": "miss" },
    {
      "src": "^/api/(.+)(?:\\.(?:js))$",
      "dest": "/api/$1",
      "check": true
    }
  ]
}
```

**🔍 판단 근거: 근본 원인 확정 — Vercel CLI의 레거시 설정 변환 오류**

| 검증 항목 | 결과 | 판단 이유 |
| --- | --- | --- |
| `/api/*` 라우팅 규칙 | ❌ **명시적 404** | `"src": "^/api(/.*)?$", "status": 404` — 모든 API 요청을 404로 처리하는 규칙이 생성됨 |
| 원래 rewrite 규칙 | ❌ 존재하지 않음 | `vercel.json`의 `routes`에서 정의한 `/api/.*` → `api/index.js` 매핑이 config에 반영되지 않음 |
| `vercel.json` 파일 자체 | ❌ 삭제됨 | `git log` 확인 결과, 이전 커밋에서 의도적으로 삭제된 상태 |

**원인이 확인되었습니다.** `vercel.json`이 삭제된 상태에서 Vercel CLI(v50.23.2)가 빌드하면서, API 라우팅 설정 없이 기본 config를 생성했고, 그 결과 모든 `/api/*` 요청을 404로 처리하는 규칙이 들어간 것입니다.

> **Thinking:** "기존 `vercel.json`의 레거시 `builds` + `routes` 포맷(v2)을 새 Vercel CLI(v50.23.2)가 v3 output format으로 변환하면서 API 라우팅을 완전히 날려버리고 있다. 현대 포맷으로 교체해야 한다."
> 

그런데 여기서 한 가지 의문이 생깁니다. 기존에 잘 작동하던 `vercel.json`은 어디로 갔을까?

Claude Code는 `git log`를 확인하고, **제가 직접 삭제한 커밋**을 발견합니다:

> "`vercel.json`을 직접 삭제하셨네요 — commit 메시지가 `fix: vercel.json collides with vercel dashboard setting`. 그래서 라우팅 설정이 아예 없어진 거예요. 삭제한 건 맞지만, 라우팅은 꼭 필요해요. 현대 포맷으로 새로 만들고 로컬에서 먼저 검증할게요."
> 

여기서 인상적이었던 점은, Claude Code가 단순히 "파일이 없으니 만들겠습니다"라고 하지 않고, **왜 삭제했는지 맥락을 파악하고, 그 의도를 존중하면서도 필요한 설정을 복원하는 방향**으로 접근했다는 것입니다.

### Step 4-3. 새 `vercel.json` 작성 및 검증

Claude Code는 레거시 `builds` + `routes` 대신, 현대 Vercel 설정 포맷으로 새 파일을 작성합니다:

```json
{
  "functions": {
    "api/index.js": {
      "includeFiles": "content/**"
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index.js"
    }
  ]
}
```

이 설정이 하는 일:

| 항목 | 역할 |
| --- | --- |
| `functions` | `api/index.js`를 Serverless 함수로 지정하고, `content/**` 파일을 번들에 포함 |
| `includeFiles` | Markdown 게시물 파일이 런타임에 `process.cwd()`로 접근 가능하도록 보장 |
| `rewrites` | 모든 `/api/*` 요청을 `api/index.js` (Express 앱)으로 라우팅 |

작성 후 바로 배포하지 않고, **로컬에서 먼저 빌드하여 생성된 config.json을 검증**합니다:

```bash
vercel build 2>&1 | tail -5
cat .vercel/output/config.json
```

**검증 결과:**

```json
{
  "src": "^/api(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$",
  "dest": "/api/index.js?path=$1",
  "check": true
}
```

**🔍 판단 근거: 라우팅 설정 복원 확인**

| 검증 항목 | 수정 전 | 수정 후 | 판단 |
| --- | --- | --- | --- |
| `/api/*` 매칭 시 동작 | `"status": 404` (차단) | `"dest": "/api/index.js"` (전달) | ✅ 함수로 라우팅됨 |
| `check` 플래그 | 없음 | `true` | ✅ 함수 응답 시 뒤의 404 규칙 스킵 |

이번에는 `/api/*` 요청이 404가 아니라 `api/index.js`로 정상 라우팅되는 것을 확인합니다. `"check": true` 플래그가 붙어 있으므로, 함수가 응답을 반환하면 뒤의 404 규칙은 실행되지 않습니다.

검증이 끝난 후 배포합니다:

```bash
vercel --prod
```

배포 후 다시 curl로 테스트:

```bash
curl -s https://jhyeok-dev.vercel.app/api/posts && echo \
&& curl -s -X POST https://jhyeok-dev.vercel.app/api/analytics/view \
  -H "Content-Type: application/json" \
  -d '{"post_id":"test"}'
```

**결과:**

```json
[{"id":"2026-02-28-...","title":"Essay ...", ...}]
{"success":true}
```

**🔍 판단 근거: 라우팅 문제 완전 해결 확인**

| 검증 항목 | 수정 전 | 수정 후 | 판단 |
| --- | --- | --- | --- |
| GET `/api/posts` | ❌ Vercel 404 | ✅ JSON 배열 반환 | 라우팅 정상 |
| POST `/api/analytics/view` | ❌ Vercel 404 | ✅ `{"success":true}` | KV 연결 + 핸들러 모두 정상 |

API 라우팅이 복원되었습니다. 첫 번째 문제는 해결되었지만, Claude Code는 여기서 멈추지 않고 **실제 브라우저 환경에서의 검증**으로 넘어갑니다.

### Step 5. Browser 검증 — 브라우저에서도 동작하는가?

Playwright MCP를 통해 실제 브라우저에서 웹사이트를 열고 네트워크 요청을 모니터링합니다.

글 목록(`/api/posts`)은 정상적으로 표시되지만, 조회수 API가 여전히 동작하지 않습니다. 
`browser_network_requests`로 확인한 결과:

```
[GET]  /api/profile                                    => 200 ✅
[GET]  /api/posts                                      => 200 ✅
[GET]  /api/analytics/2026-02-28-essay-feedback-writer.md => 200 ✅
[GET]  /api/posts/2026-02-28-essay-feedback-writer.md     => 200 ✅
[POST] /api/analytics/view                              => 500 ❌
[GET]  /api/analytics/2026-02-28-essay-feedback-writer.md => 200 ✅
```

**🔍 판단 근거: curl에서는 성공, 브라우저에서만 실패 → 브라우저 고유 제약 의심**

| 검증 항목 | 결과 | 판단 이유 |
| --- | --- | --- |
| GET 요청 (5건) | ✅ 모두 200 | 라우팅, 서버 로직 모두 정상 — Step 4에서 해결한 문제와 일치 |
| POST `/api/analytics/view` | ❌ 500 | **GET은 성공하고 POST만 실패** — 서버 로직 문제가 아님 (curl에서는 성공했으므로) |
| curl vs 브라우저 차이 | 🔑 핵심 단서 | 같은 endpoint에 curl은 200, 브라우저는 500 → **브라우저만 적용되는 제약** = CORS |

GET은 성공하고 POST만 실패한다는 패턴이 CORS를 의심하게 만드는 이유: 브라우저는 POST 같은 "non-simple request"에 대해 **preflight(OPTIONS) 요청**을 먼저 보내고, CORS 헤더가 일치하지 않으면 본 요청을 차단합니다. 반면 GET은 simple request로 분류되어 preflight 없이 통과하는 경우가 많습니다.

Claude Code는 즉시 환경 변수의 **값** 검증으로 들어갑니다:

```bash
vercel env pull --environment=production /tmp/prod.env 2>&1
grep ALLOWED /tmp/prod.env
rm /tmp/prod.env
```

**결과:**

```
ALLOWED_ORIGINS="http://localhost:3000,https://....vercel.app/"
```

발견했습니다.

> "**마지막 슬래시(`/`)가 문제예요.** 브라우저가 보내는 `Origin` 헤더는 `https://jhyeok-dev.vercel.app` (슬래시 없음)인데, 서버는 `https://jhyeok-dev.vercel.app/` (슬래시 있음)과 비교하니까 매칭 실패 → CORS 에러 → 500."
> 

**🔍 판단 근거: trailing slash로 인한 Origin 불일치 확정**

| 항목 | 서버 설정 값 | 브라우저 Origin 헤더 | 일치 여부 |
| --- | --- | --- | --- |
| `ALLOWED_ORIGINS` | `https://....vercel.app/` | `https://....vercel.app` | ❌ **불일치** (trailing `/`) |

단 하나의 trailing slash `/` 때문에 전체 조회수 기능이 먹통이었던 것입니다.

Claude Code가 Vercel CLI로 환경 변수를 수정하고 재배포한 뒤, Playwright MCP로 브라우저에서 최종 검증을 완료합니다.

**🔍 최종 검증 결과:**

| 검증 항목 | 수정 전 | 수정 후 |
| --- | --- | --- |
| POST `/api/analytics/view` (브라우저) | ❌ 500 | ✅ 200 |
| 조회수 카운트 증가 | ❌ 미동작 | ✅ 정상 카운트 |

조회수 API가 정상적으로 동작하는 것을 확인했습니다.

### 📋 3-3. 디버깅 과정 요약

| 단계 | 검증 질문 | 행동 | 결과 | "문제 없음/있음" 판단 근거 |
| --- | --- | --- | --- | --- |
| 1. 코드 읽기 | 코드/로직 문제인가? | kv.js, index.js, .env.example 분석 | ✅ 통과 | 핸들러 로직, KV 분기, 경로 패턴 모두 정상 |
| 2. ENV 확인 | 환경 변수가 있는가? | `vercel env ls` | ⚠️ 부분 통과 | 존재는 확인, **값은 미검증** (이후 Step 5에서 재검증) |
| 3. 로그 확인 | 함수가 실행되는가? | `vercel logs` | ⏭️ 불명확 | 결론 내리기 어려워 다음 단계로 즉시 이동 |
| 4. curl 테스트 | 요청이 서버에 도달하는가? | HTTP 직접 호출 | ❌ **실패** | `/api/*` 전체 404 + Vercel 자체 404 페이지 = Express 도달 전 차단 |
| 4-1. 추가 curl | 어떤 라우트가 가져가는가? | `/api/index` 호출 | ❌ **실패** | HTML 반환 → catch-all이 API 삼킴 확인 |
| 4-2. 빌드 분석 | 왜 라우팅이 안 되는가? | `config.json` 확인 | 🔴 **근본 원인** | 명시적 404 규칙 발견 + `vercel.json` 삭제 확인 |
| 4-3. 설정 재작성 | 새 설정이 올바른가? | 로컬 빌드 → config 검증 → 배포 | ✅ **해결** | config에 `dest: api/index.js` 확인 + curl 재테스트 JSON 정상 반환 |
| 5. 브라우저 검증 | 브라우저에서도 동작하는가? | Playwright 네트워크 모니터링 | ❌ **실패** | GET 성공 + POST만 500 + curl은 성공 = 브라우저 고유 제약(CORS) |
| 5-1. ENV 값 검증 | CORS 설정이 올바른가? | `vercel env pull` + grep | 🔴 **근본 원인** | trailing slash로 Origin 문자열 불일치 |
| 5-2. 수정 및 재배포 | 최종 동작하는가? | ENV 수정 + Playwright 재검증 | ✅ **완전 해결** | POST 200 + 조회수 카운트 정상 동작 |

## 4. AI가 해결해도 디버깅 전략이 필요한 이유

앞서 살펴본 것처럼, Claude Code는 두 개의 버그를 체계적으로 찾아내고 고쳤습니다. 꽤 인상적인 과정이었습니다. 그렇다면 이런 질문이 자연스럽게 따라옵니다:

> "이 정도면 AI한테 맡기면 되는 거 아닌가? 개발자가 직접 디버깅 전략을 알아야 할 이유가 있나?"
> 

저는 **있다**고 생각합니다. 그리고 그 이유는 "AI가 못하니까"가 아니라, **AI가 잘할수록 더 필요해지기 때문**입니다.

### 4-1. 검증할 수 없으면, 해결된 건지 알 수 없다

이번 디버깅에서 가장 위험했던 순간은 Step 4-3이었습니다. Claude Code가 새 `vercel.json`을 작성하고 배포한 뒤, curl로 테스트한 결과:

```json
{"success":true}
```

이 시점에서 "문제 해결됨"이라고 판단할 수 있었습니다. 실제로 curl 테스트는 통과했고, API는 정상 응답을 반환했습니다.

하지만 **진짜 문제는 아직 남아 있었습니다.** 브라우저에서 POST 요청을 보내면 여전히 500 에러가 발생했고, 그 원인은 환경 변수의 trailing slash — 완전히 다른 레이어의 버그였습니다.

만약 제가 디버깅 전략에 대한 이해 없이 Claude Code의 첫 번째 수정만 보고 "해결됐네"라고 넘어갔다면 어떻게 됐을까요? curl에서는 동작하지만 실제 사용자는 조회수가 카운트되지 않는, **눈에 보이지 않는 장애**가 프로덕션에 그대로 남았을 것입니다.

이것이 핵심입니다. AI가 제시한 해결책이 **진짜 해결인지 검증하는 것은 개발자의 몫**입니다. 그리고 그 검증은 디버깅 전략 — "어떤 레이어까지 확인해야 완전한 검증인가"에 대한 감각 — 없이는 불가능합니다.

이번 사례에서 Claude Code는 스스로 브라우저 검증까지 진행했지만, 이것은 제가 Playwright MCP를 활성화했기 때문에 가능했을 수 있습니다. 만약 Claude Code에게 브라우저 단에서 API 동작을 확인할 수 있는 도구를 제공하지 않았다면, 해당 에러는 수정되지 않은 채 그대로 남아 있었을 가능성이 큽니다.

AI가 모든 레이어를 알아서 검증해 줄 것이라고 기대하는 것과,

개발자가 **검증해야 할 레이어를 이해하고 명확히 지시하는 것**은 전혀 다른 결과를 만든다고 생각합니다.

### 4-2. 원인을 모르면, 같은 문제를 반복한다

Claude Code가 찾아낸 두 번째 버그를 다시 떠올려 보겠습니다.

```
ALLOWED_ORIGINS="https://jhyeok-dev.vercel.app/"
                                                ^ 이 슬래시 하나
```

이 버그는 고치기는 쉽습니다. 슬래시를 지우면 됩니다.

하지만 **왜 이 문제가 발생했는지** 이해하는 것은 전혀 다른 차원의 일입니다. 이 trailing slash 문제의 근본 원인은 다음과 같습니다:

- 브라우저의 `Origin` 헤더는 [RFC 6454](https://tools.ietf.org/html/rfc6454)에 따라 **scheme + host + port**만 포함하고, path(따라서 trailing slash도)를 포함하지 않습니다
- 그런데 URL을 복사할 때 브라우저 주소창에서 가져오면 trailing slash가 붙는 경우가 많습니다
- CORS 미들웨어는 문자열 exact match로 비교하기 때문에, 한 글자만 달라도 실패합니다

이 인과 관계를 이해한 개발자는 앞으로 **다른 프로젝트에서도** 같은 실수를 하지 않을 것입니다. 새로운 서비스를 배포할 때 CORS 설정을 하면서 "Origin 헤더에는 trailing slash가 안 붙지"라는 지식이 자동으로 작동합니다. 다른 환경 변수를 설정할 때도 "문자열 비교에서 사소한 차이가 장애를 만든다"는 감각이 살아 있습니다.

반면, AI가 고쳐준 결과만 받아들인 개발자는 다음에 비슷한 상황을 만나면 **똑같은 시간을 다시 소비**할 것입니다. "슬래시를 지웠더니 됐다"는 기억은 있지만, 왜 그랬는지 모르기 때문에 다른 맥락에서 같은 원리가 작동할 때 연결하지 못합니다.

AI는 **이번 문제**를 고쳐줍니다. 디버깅 전략은 **다음 문제**를 예방합니다. 이 둘은 대체 관계가 아니라 보완 관계입니다.

### 4-3. 결국 AI 시대의 디버깅 능력이란

AI Coding Agent가 고도화될수록, 개발자에게 필요한 디버깅 능력의 형태는 변합니다. "console.log를 어디에 찍을지"같은 전술적 기술의 가치는 줄어들 수 있습니다. 하지만 다음 두 가지는 오히려 더 중요해집니다:

**첫째, "이게 진짜 해결된 건가?"를 판단하는 검증 능력.** curl에서 성공했다고 끝이 아닙니다. 어떤 레이어까지 확인해야 완전한 검증인지, 어떤 조건에서 재현 테스트를 해야 하는지 아는 것은 여전히 개발자의 영역입니다.

**둘째, "왜 이런 일이 일어났는가?"를 이해하는 인과 파악 능력.** AI가 제시한 diff를 머지하기 전에, 그 변경이 왜 문제를 해결하는지 이해할 수 있어야 합니다. 그래야 비슷한 문제가 다른 형태로 나타났을 때 스스로 대응할 수 있고, AI에게 더 정확한 질문을 던질 수 있습니다.

Claude Code가 보여준 디버깅 과정은 훌륭한 참고서입니다. 하지만 참고서를 읽는 것과 그 내용을 체화하는 것은 다릅니다. AI와 함께 일하는 시대일수록, **AI의 결과물을 읽고 판단할 수 있는 개발자**가 되는 것이 더 중요해질 것이라고 생각합니다.

## 5. Claude Code Tracking 방법

Claude Code의 디버깅 전략을 제대로 이해하려면, 무엇보다 **Claude Code가 어떤 과정을 거쳐 판단하고 수정했는지 추적할 수 있어야 합니다.**
이를 위해 가장 먼저 확인해야 할 것은 Claude Code가 남기는 실행 로그입니다.

현재 저는 Ubuntu 22.04 환경을 사용하고 있으며, 기본적으로 `~/.claude/projects` 디렉토리 아래에 프로젝트별 로그가 누적되는 구조입니다. 각 프로젝트 디렉토리에는 세션 단위의 실행 기록, 명령 수행 과정, 내부 의사결정 흐름 등이 함께 저장됩니다.

다만 이 로그는 다음과 같은 이유로 **그대로 읽기에는 상당히 부담스럽습니다.**

* 실행 과정에서 생성되는 다양한 메타데이터가 함께 기록되어 신호 대비 잡음이 많고
* 실제 디버깅에 중요한 “문제 인식 → 가설 설정 → 수정 → 검증” 흐름이 한눈에 드러나지 않으며
* 로그의 양 자체가 방대해 필요한 부분만 선별하기가 쉽지 않습니다.

이 때문에 단순히 로그 파일을 직접 분석하기보다는, **유의미한 이벤트만 추출하는 방식으로 관찰 지점을 만드는 것이 훨씬 효과적입니다.**

여기서 유용한 방법이 바로 *Claude Code Hooks*를 활용하는 것입니다.

Hooks를 사용하면 다음과 같은 특정 순간만 선택적으로 가로채어 기록할 수 있습니다.

* 파일 수정이 발생했을 때
* 새로운 명령을 실행하기 직전 / 직후
* 테스트나 검증 단계가 수행될 때
* 오류를 감지하고 재시도를 결정하는 시점

이렇게 하면 전체 로그를 뒤지는 대신,
**디버깅에 실제로 의미 있는 변화만 타임라인처럼 재구성할 수 있습니다.**

결과적으로 Hooks 기반 추적은 단순한 로그 열람이 아니라,
Claude Code의 문제 해결 방식을 “관찰 가능한 전략”으로 변환해 준다는 점에서 큰 장점이 있습니다.

로그를 모두 읽는 것보다,
어떤 이벤트를 관찰해야 하는지를 정의하는 것이 Claude Code Tracking의 핵심이라고 볼 수 있습니다.

기회가 된다면 Claude Code Log Tracking 시스템을 Plugin으로 배포할 수 있으면 좋겠네요!
