https://mswjs.io/docs/api/setup-server/
https://github.com/bluwy/create-vite-extra/blob/master/template-ssr-vanilla/server.js

# 2. 목표

- Express SSR 서버 구현
- Static Site Generation
- 서버/클라이언트 데이터 공유

## ⚠️ 전제 조건

### SSR 환경 제약사항

- **`window` 객체가 존재하지 않음** - 브라우저 전용 API 사용 불가
- **`document` 객체가 존재하지 않음** - DOM 조작 불가
- **`localStorage`, `sessionStorage` 등 브라우저 스토리지 접근 불가**
- **이벤트 리스너 등 브라우저 이벤트 시스템 사용 불가**

### 구현 시 주의사항

- 모든 브라우저 전용 코드는 환경 체크 필요: `typeof window !== 'undefined'`
- SSR과 클라이언트 환경을 모두 고려한 코드 작성
- 브라우저 API 의존성 최소화

## (1) 체크리스트

### Express SSR 서버

- [ ] Express 미들웨어 기반 서버 구현
- [ ] 개발/프로덕션 환경 분기 처리
- [ ] HTML 템플릿 치환 (`<!--app-html-->`, `<!--app-head-->`)

### 서버 사이드 렌더링

- [ ] 서버에서 동작하는 Router 구현
- [ ] 서버 데이터 프리페칭 (상품 목록, 상품 상세)
- [ ] 서버 상태관리 초기화

### 클라이언트 Hydration

- [ ] `window.__INITIAL_DATA__` 스크립트 주입
- [ ] 클라이언트 상태 복원
- [ ] 서버-클라이언트 데이터 일치

### Static Site Generation

- [ ] 동적 라우트 SSG (상품 상세 페이지들)
- [ ] 빌드 타임 페이지 생성
- [ ] 파일 시스템 기반 배포

## (2) 구현 가이드

### 1) Express 서버 (`server.js`)

**핵심 키워드:** middleware, template, render, hydration

```jsx
// 환경 분기
if (!prod) {
  // Vite dev server + middleware
} else {
  // compression + sirv
}

// 렌더링 파이프라인
app.use("*", async (req, res) => {
  const url = req.originalUrl.replace(base, "");
  const { html, head, initialData } = await render(url);

  // Template 치환
  const finalHtml = template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html)
    .replace("</head>", `${initialDataScript}</head>`);
});
```

### 2) 서버 렌더링 (`main-server.js`)

**핵심 키워드:** routing, prefetch, store, params

```jsx
class ServerRouter {
  addRoute(path, handler) {
    // :id → (\\\\d+) 정규식 변환
    // paramNames 배열 저장
  }

  findRoute(url) {
    // 매칭 + params 추출
    return { handler, params };
  }
}

async function prefetchData(route, params) {
  if (route.path === "/") {
    // mockGetProducts + mockGetCategories
    // productStore.dispatch(SETUP)
  } else if (route.path === "/product/:id/") {
    // mockGetProduct(params.id)
    // productStore.dispatch(SET_CURRENT_PRODUCT)
  }
}

export async function render(url) {
  // 1. Store 초기화
  // 2. 라우트 매칭
  // 3. 데이터 프리페칭
  // 4. HTML 생성
  return { html, head, initialData };
}
```

### 3) SSG (`static-site-generate.js`)

**핵심 키워드:** build-time, dynamic routes, file generation

```jsx
async function generateStaticSite() {
  // 1. 템플릿 + SSR 모듈 로드
  const template = await fs.readFile(`${DIST_DIR}/index.html`);
  const { render } = await import(`${SSR_DIR}/main-server.js`);

  // 2. 페이지 목록 생성
  const pages = await getPages(); // /, /404, /product/1/, /product/2/, ...

  // 3. 각 페이지 렌더링 + 저장
  for (const page of pages) {
    const rendered = await render(page.url);
    const html = template.replace(/* ... */);
    await saveHtmlFile(page.filePath, html);
  }
}

async function getPages() {
  const products = await mockGetProducts({ limit: 20 });
  return [
    { url: "/", filePath: `${DIST_DIR}/index.html` },
    { url: "/404", filePath: `${DIST_DIR}/404.html` },
    ...products.map((p) => ({
      url: `/product/${p.id}/`,
      filePath: `${DIST_DIR}/product/${p.id}/index.html`,
    })),
  ];
}
```

### 4) Hydration (`main.js`)

**핵심 키워드:** client-side, initial data, store sync

```jsx
// 서버 데이터 복원
if (window.__INITIAL_DATA__) {
  const data = window.__INITIAL_DATA__;
  if (data.products) productStore.dispatch(PRODUCT_ACTIONS.SETUP, data);
  if (data.currentProduct) productStore.dispatch(PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, data);
  delete window.__INITIAL_DATA__;
}

render(); // 클라이언트 렌더링 시작
```

## (3) 테스트 통과하기

```bash
$ pnpm run test:e2e:basic
```

![스크린샷 2025-08-29 21.53.35.png](attachment:390fd36b-cccd-43e2-96dd-2e7fef0c67ab:스크린샷_2025-08-29_21.53.35.png)
