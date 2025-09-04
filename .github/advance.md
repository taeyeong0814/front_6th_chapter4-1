# 2. 목표

- renderToString을 이용하여 SSG 진행하기
- Universal (Client와 Server에서 모두 실행 가능한) React 코드 작성하기
- 안전한 Hydration

## (1) 체크리스트

### React SSR

- [ ] `renderToString` 을 이용하여 서버사이드에서 App 렌더링
- [ ] Universal React Router (서버/클라이언트 분기)
- [ ] React 상태관리 서버 초기화

### React Hydration

- [ ] Hydration 불일치 방지
- [ ] 클라이언트 상태 복원

### Static Site Generation

- [ ] 동적 라우트 SSG (상품 상세 페이지들)
- [ ] 빌드 타임 페이지 생성
- [ ] 파일 시스템 기반 배포

## (2) 구현 가이드

### 1) React SSR 서버 (`server.js`)

**핵심 키워드:** renderToString, React hydration, TypeScript SSR

```jsx
app.use(async (req, res) => {
  const { html, head, initialData } = await render(url, query);

  const finalHtml = template
    .replace("<!--app-html-->", html)
    .replace("<!--app-head-->", head)
    .replace("</head>", `${initialDataScript}</head>`);
});
```

### 2) React SSR 렌더링 (`main-server.tsx`)

**핵심 키워드:** renderToString, React Router server, store initialization

```tsx
import { renderToString } from "react-dom/server";

export const render = async (url: string, query: QueryPayload) => {
  // 1. React Router 서버 초기화
  // 2. 페이지별 데이터 프리로딩
  // 3. 페이지별 메타데이터 설정 후 head로 변환
  // 4. React 컴포넌트 → HTML 문자열
  const html = renderToString(<App />);

  return { html, head, initialData };
};
```

### 3) 서버 데이터 로딩 (`ssr-data.ts`)

**핵심 키워드:** mock API, TypeScript interfaces, error handling

```tsx
export interface HomePageData {
  products: any[];
  categories: any[];
  totalCount: number;
}

export async function loadHomePageData(url: string): Promise<HomePageData | null> {
  // 메인페이지에 필요한 데이터를 불러옴
}

export async function loadProductDetailData(productId: string): Promise<ProductDetailData | null> {
  // 상품 상세페이지에 필요한 데이터를 불러옴
}
```

### 4) React Hydration (`hydration.ts`)

**핵심 키워드:** window.**INITIAL_DATA**, store restoration, cleanup

```tsx
export function hydrateFromServerData() {
  // window.__INITIAL_DATA__ 를 이용하여 서버에서 넘겨준 데이터를 클라이언트에서 그대로 사용
}
```

### 5) Universal Router (`router.ts`)

**핵심 키워드:** MemoryRouter vs Router, server/client branching

```tsx
// router.tsx
const createRouter = () => {
  if (typeof window === "undefined") {
    // 서버: MemoryRouter
    return new MemoryRouter();
  } else {
    // 클라이언트: BrowserRouter
    return new Router();
  }
};

export const router = createRouter();

// App.tsx
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute("*", NotFoundPage);
```

### 6) React SSG (`static-site-generate.js`)

**핵심 키워드:** build-time rendering, React components to static HTML

```jsx
async function generateStaticSite() {
  // 1. csr로 빌드된 결과물을 가져옴.
  // 2. react의 renderToString을 이용하여 본문 렌더링
  // 3. 만들어진 내용을 다시 html로 저장
}
```

## (3) 테스트 통과하기
