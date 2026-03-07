---
title: "Web에서 iPad 애플펜슬 지원하기"
date: 2026-03-07
category: dev
summary: Web에서 iPad 애플펜슬 지원하는 방법
tags: ["웹", "Progressive Web App", "Apple Pencil", "iPad"]
---

개발을 하다보면 웹 페이지 화면에서 iPad와 같이 스타일러스가 있는 기기에서 글자를 적거나 그림을 그릴 수 있게 기능을 추가해야하는 경우가 종종 있습니다.

이럴 때, 웹을 네이티브 앱으로 변경하는 것이 아니라 **웹 그대로** iPad의 스타일러스를 인식할 수 있게끔 하는 HTML & JS 모듈이 있습니다. HTML에서는 `<canvas>` 태그가, JS에서는 **Pointer Events API**가 그 역할을 합니다.

## 1. 기본 원리

### 1.1 `<canvas>` 태그

`<canvas>`는 HTML5에서 그래픽과 애니메이션을 그릴 수 있는 영역을 지정하는 태그입니다. 그 자체로는 빈 직사각형 영역일 뿐이고, 실제 그리기는 JavaScript의 Canvas API(`getContext('2d')`)를 통해 이루어집니다.

```html-demo
<canvas id="drawCanvas" width="800" height="600"></canvas>

<script>
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');

// 이제 ctx를 통해 선, 도형, 이미지 등을 그릴 수 있습니다
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(200, 100);
ctx.stroke();
</script>
```

### 1.2 Pointer Events API

Pointer Events API는 마우스, 터치, 펜 등 다양한 입력 장치에서 발생하는 이벤트를 **하나의 통합된 API**로 처리할 수 있도록 만들어진 W3C 표준입니다.

이전에는 마우스 입력은 `MouseEvent`, 터치 입력은 `TouchEvent`로 따로 처리해야 했습니다. 하지만 Pointer Events를 사용하면 입력 장치 종류에 관계없이 `pointerdown`, `pointermove`, `pointerup` 같은 하나의 이벤트 체계로 모든 입력을 처리할 수 있습니다.

이 두 가지를 조합하면 **canvas 위에서 스타일러스 입력을 인식하고 그리기**가 가능해집니다.

### 1.3 `<canvas>` 태그와 Pointer Events API를 이용한 Stylus 인식

간단히 정리하면 이렇습니다.

- `<canvas>` 태그로 스타일러스 입력을 받을 **그리기 영역**을 만들고
- **Pointer Events API**로 마우스, 터치, 펜(스타일러스) 이벤트를 감지하여

이를 캔버스 위에 그려주거나 조작하는 방식으로 동작합니다.

## 2. Pointer Events

### 2.1 핵심 이벤트 종류

| 이벤트 | 설명 |
|--------|------|
| `pointerdown` | 펜이 화면에 닿거나, 마우스 버튼을 누르는 순간 |
| `pointermove` | 포인터가 이동할 때 (그리기의 핵심) |
| `pointerup` | 펜을 떼거나, 마우스 버튼을 놓는 순간 |
| `pointercancel` | 시스템이 이벤트를 취소할 때 (예: 전화 수신) |
| `pointerleave` | 포인터가 요소 영역을 벗어날 때 |

### 2.2 `pointerType`으로 입력 장치 구분하기

Pointer Events의 가장 큰 장점은 `pointerType` 속성으로 현재 입력이 어떤 장치에서 오는지 구분할 수 있다는 점입니다.

```javascript
canvas.addEventListener('pointerdown', (e) => {
  switch (e.pointerType) {
    case 'pen':
      // 스타일러스 입력 → 그리기 시작
      break;
    case 'touch':
      // 손가락 터치 → 스크롤이나 제스처로 활용
      break;
    case 'mouse':
      // 마우스 입력 → 일반 마우스 동작
      break;
  }
});
```

이를 활용하면 **"펜으로는 그리기, 손가락으로는 스크롤"** 같은 자연스러운 UX를 구현할 수 있습니다.

### 2.3 스타일러스 전용 속성들

스타일러스가 일반 터치나 마우스와 다른 결정적 차이는 **필압(pressure)**, **기울기(tilt)** 정보를 제공한다는 점입니다.

```javascript
canvas.addEventListener('pointermove', (e) => {
  // 필압: 0.0 (떠있음) ~ 1.0 (최대 압력)
  const pressure = e.pressure;

  // 기울기: -90 ~ 90도
  const tiltX = e.tiltX; // X축 기울기
  const tiltY = e.tiltY; // Y축 기울기

  // 접촉 면적
  const width = e.width;
  const height = e.height;
});
```

필압을 활용하면 선의 굵기나 투명도를 자연스럽게 조절할 수 있습니다.

```javascript
canvas.addEventListener('pointermove', (e) => {
  if (!isDrawing) return;

  const pressure = e.pressure || 0.5;

  ctx.lineWidth = 1 + pressure * 10;   // 필압에 따라 1~11px
  ctx.globalAlpha = 0.3 + pressure * 0.7; // 필압에 따라 투명도 조절

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});
```

### 2.4 `getCoalescedEvents()`로 부드러운 선 그리기

스타일러스는 보통 초당 수백 개의 좌표를 보내지만, 기본 `pointermove` 이벤트는 화면 주사율(보통 60Hz)에 맞춰 좌표를 간추려서 전달합니다. 그래서 빠르게 그으면 선이 각져 보일 수 있습니다.

`getCoalescedEvents()`를 사용하면 프레임 사이에 누락된 중간 좌표까지 모두 받아올 수 있습니다.

```javascript
canvas.addEventListener('pointermove', (e) => {
  if (!isDrawing) return;

  // 중간에 빠진 좌표까지 전부 가져오기
  const points = e.getCoalescedEvents();

  for (const point of points) {
    ctx.lineTo(point.offsetX, point.offsetY);
    ctx.lineWidth = 1 + point.pressure * 10;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point.offsetX, point.offsetY);
  }
});
```

일반 `pointermove`만 사용했을 때와 `getCoalescedEvents()`를 사용했을 때의 차이는 빠르게 곡선을 그릴수록 눈에 띄게 나타납니다.

## 3. touch-action CSS 설정 및 실전 팁

### 3.1 `touch-action: none`은 필수

캔버스에서 스타일러스 그리기를 구현할 때 가장 흔히 겪는 문제가 있습니다. 펜으로 선을 그으려는데 **브라우저가 스크롤이나 줌으로 이벤트를 가져가버리는 것**입니다.

이를 방지하려면 CSS의 `touch-action` 속성을 `none`으로 설정해야 합니다.

cf. `touch-action`은 브라우저의 기본 터치 제스처(스크롤, 줌 등)를 허용할지 차단할지 결정하는 CSS 속성입니다.

```css
canvas {
  touch-action: none; /* 브라우저의 기본 터치 동작 비활성화 */
}
```

이 한 줄이 없으면 `pointermove` 이벤트가 도중에 끊기거나, 브라우저가 터치를 스크롤로 해석해서 그리기가 제대로 작동하지 않습니다.

`touch-action`에 사용할 수 있는 값들은 다음과 같습니다.

| 값 | 동작 |
|----|------|
| `none` | 모든 브라우저 터치 동작 비활성화 (그리기에 적합) |
| `auto` | 기본값. 브라우저가 알아서 처리 |
| `pan-x` | 가로 스크롤만 허용 |
| `pan-y` | 세로 스크롤만 허용 |
| `manipulation` | 스크롤과 핀치 줌만 허용 (더블탭 줌 비활성화) |

### 3.2 고해상도 디스플레이 대응 (devicePixelRatio)

iPad 같은 기기는 `devicePixelRatio`가 2 이상입니다. canvas의 CSS 크기와 실제 해상도를 맞추지 않으면 그려진 선이 흐릿하게 보입니다.

```javascript
function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // 캔버스의 실제 픽셀 수를 DPR만큼 키움
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr); // 좌표계를 CSS 픽셀 기준으로 맞춤

  return ctx;
}
```

이렇게 하면 CSS상으로는 같은 크기이지만, 실제 렌더링은 고해상도로 이루어져 선명한 결과를 얻을 수 있습니다.

### 3.3 Safari의 기본 동작 방지

Safari에서는 `touch-action: none`만으로는 부족한 경우가 있습니다. `touchstart` 이벤트에서 `preventDefault()`를 명시적으로 호출해 주는 것이 안전합니다.

```javascript
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
}, { passive: false });
```

`{ passive: false }` 옵션을 반드시 함께 지정해야 `preventDefault()`가 정상 동작합니다.

## 4. 로컬 개발 환경에서 iPad로 테스트하기

개발을 노트북이나 데스크탑에서 하다 보면 iPad에서 스타일러스를 직접 테스트하기 어렵다고 느낄 수 있습니다. 하지만 **같은 Wi-Fi 네트워크**에 연결되어 있다면 간단하게 테스트할 수 있습니다.

먼저 개발 머신의 로컬 IP를 확인합니다.

```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Linux
hostname -I | awk '{print $1}'

# Windows (PowerShell 또는 CMD)
ipconfig | findstr "IPv4"
```

그 다음, 개발 서버를 `0.0.0.0`으로 바인딩하여 외부 접근을 허용합니다. 예를 들어 Vite라면:

```bash
npx vite --host 0.0.0.0 --port 3000
```

이제 iPad Safari에서 `http://로컬 머신 IP:port`로 접속하면 개발 중인 페이지를 바로 열 수 있고, Apple Pencil로 필압과 기울기까지 실제 테스트가 가능합니다.

별도의 배포나 ngrok 같은 터널링 없이도, 같은 네트워크라는 조건만 충족하면 즉시 실기기 테스트를 할 수 있어 개발 속도가 훨씬 빨라집니다.

## 5. 전체 흐름 정리

```
1. HTML에서 <canvas> 태그로 그리기 영역 생성
2. CSS에서 touch-action: none 설정
3. JS에서 Pointer Events (pointerdown, pointermove, pointerup) 등록
4. e.pointerType으로 펜/터치/마우스 구분
5. e.pressure, e.tiltX, e.tiltY로 필압과 기울기 반영
6. getCoalescedEvents()로 부드러운 선 구현
7. devicePixelRatio 대응으로 고해상도 렌더링
```

이것만 알면 별도의 네이티브 앱 없이도 웹에서 스타일러스를 활용한 그리기 기능을 충분히 구현할 수 있습니다.

## 6. stylus demo

아래 캔버스에서 스타일러스 또는 마우스로 직접 그려볼 수 있습니다.

```html-demo
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0f1117; position: relative; }
canvas {
  display: block;
  width: 100%;
  height: 280px;
  touch-action: none;
  cursor: crosshair;
}
#btnClear {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #242836;
  border: 1px solid #2e3345;
  color: #e4e6f0;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
}
#btnClear:hover { background: #2e3345; }
</style>

<canvas id="canvas"></canvas>
<button id="btnClear">지우기</button>

<script>
window.onload = function() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let lastX = 0, lastY = 0;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#1a1d27';
  ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

  document.getElementById('btnClear').addEventListener('click', () => {
    ctx.fillStyle = '#1a1d27';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  });

  canvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];

    for (const ce of events) {
      const x = ce.clientX - rect.left;
      const y = ce.clientY - rect.top;
      const pressure = ce.pressure || 0.5;

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#6c8aff';
      ctx.lineWidth = 2 + pressure * 8;
      ctx.lineCap = 'round';
      ctx.stroke();

      lastX = x;
      lastY = y;
    }
  });

  canvas.addEventListener('pointerup', () => { isDrawing = false; });
  canvas.addEventListener('pointerleave', () => { isDrawing = false; });
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
};
</script>
```