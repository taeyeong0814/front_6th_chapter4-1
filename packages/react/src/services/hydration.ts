import { PRODUCT_ACTIONS, productStore } from "../entities";

// 전역 타입 정의
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __INITIAL_DATA__?: any;
  }
}

export function hydrateWithServerData() {
  // 서버에서 전달받은 초기 데이터가 있는지 확인
  const initialData = window.__INITIAL_DATA__;
  if (typeof window === "undefined" || !initialData) {
    return;
  }

  if (initialData.products && initialData.categories) {
    // 홈페이지 데이터 하이드레이션
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
  } else if (initialData.currentProduct) {
    // 상품 상세 페이지 데이터 하이드레이션
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: initialData.currentProduct,
    });

    if (initialData.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: initialData.relatedProducts,
      });
    }
  }
}
