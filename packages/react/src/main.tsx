import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { hydrateWithServerData } from "./services/hydration";
import { productStore, cartStore } from "./entities";
import { PRODUCT_ACTIONS, CART_ACTIONS } from "./entities";
import type { Product, Cart } from "./entities";

// 초기 데이터 타입 정의
interface InitialData {
  products?: Product[];
  categories?: Record<string, Record<string, string>>;
  totalCount?: number;
  currentProduct?: Product;
  relatedProducts?: Product[];
  cart?: Cart[];
  filters?: {
    searchQuery: string;
    category: { category1: string; category2: string };
    sort: string;
    limit: number;
  };
}

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  // 서버 데이터로 스토어 하이드레이션 (라우터 시작 전에)
  hydrateWithServerData();

  router.start();

  const rootElement = document.getElementById("root")!;

  // window.__INITIAL_DATA__에서 초기 데이터 읽기
  const initialData = (window as { __INITIAL_DATA__?: InitialData }).__INITIAL_DATA__;

  if (initialData) {
    // 상품 스토어 초기화
    if (initialData.products) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: initialData.products,
          categories: initialData.categories,
          totalCount: initialData.totalCount,
          loading: false,
          status: "done",
          error: null,
        },
      });
    }

    if (initialData.currentProduct) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: initialData.currentProduct,
      });
    }

    if (initialData.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: initialData.relatedProducts,
      });
    }

    // 장바구니 스토어 초기화 (필요한 경우)
    if (initialData.cart) {
      cartStore.dispatch({
        type: CART_ACTIONS.SETUP,
        payload: initialData.cart,
      });
    }

    // 초기 데이터 삭제
    delete (window as { __INITIAL_DATA__?: InitialData }).__INITIAL_DATA__;

    // hydration 렌더링
    hydrateRoot(rootElement, <App />);
  } else {
    // 일반 CSR 렌더링
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
enableMocking().then(main);
