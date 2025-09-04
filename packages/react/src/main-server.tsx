import { renderToString } from "react-dom/server";
import { App } from "./App";
import { router } from "./router";
import { loadHomePageData, loadProductDetailData } from "./services/ssr-data";
import { PRODUCT_ACTIONS, productStore, type Product } from "./entities";
import { HomePage, ProductDetailPage } from "./pages";
import type { QueryPayload, StringRecord } from "@hanghae-plus/lib";

interface InitialData {
  products?: Product[];
  categories?: Record<string, Record<string, string | StringRecord>>;
  totalCount?: number;
  currentProduct?: Product;
  relatedProducts?: Product[];
  filters?: {
    searchQuery: string;
    category: { category1: string; category2: string };
    sort: string;
    limit: number;
  };
}

export const render = async (url: string, query: QueryPayload) => {
  // URL 보정: 빈 문자열인 경우 "/", "/"로 시작하지 않으면 "/" 추가
  const actualUrl = url;

  // URL에서 쿼리 파라미터 파싱
  const urlObj = new URL(url, "http://localhost");
  const searchQuery = urlObj.searchParams.get("search") || "";
  const category1 = urlObj.searchParams.get("category1") || "";
  const category2 = urlObj.searchParams.get("category2") || "";
  const sort = urlObj.searchParams.get("sort") || "price_asc";
  const limit = parseInt(urlObj.searchParams.get("limit") || "20");

  // SSR에서도 라우터 시작 (start 메소드는 SSR 안전하게 수정됨)
  router.push(url);
  router.query = { ...query };

  // URL에 따라 필요한 데이터 미리 로드
  let initialData: InitialData = {};

  try {
    // URL 패턴에 따라 데이터 로드
    if (router.target === HomePage) {
      // 홈페이지 - 상품 목록 데이터 로드
      const homeData = await loadHomePageData(actualUrl);
      if (homeData) {
        // 검색 필터 정보를 포함한 initialData 생성
        initialData = {
          ...homeData,
          filters: {
            searchQuery,
            category: { category1, category2 },
            sort,
            limit,
          },
        };

        // SSR 시 스토어를 미리 초기화
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: {
            products: homeData.products,
            categories: homeData.categories,
            totalCount: homeData.totalCount,
            loading: false,
            status: "done",
            error: null,
          },
        });
      }
    } else if (router.target === ProductDetailPage) {
      // 상품 상세 페이지 - 해당 상품 데이터 로드
      const productId = router.params.id;
      const productData = await loadProductDetailData(productId);
      if (productData) {
        initialData = productData;

        // SSR 시 스토어를 미리 초기화
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
          payload: productData.currentProduct,
        });

        if (productData.relatedProducts) {
          productStore.dispatch({
            type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
            payload: productData.relatedProducts,
          });
        }
      }
    }

    // 실제 App 컴포넌트를 SSR로 렌더링
    const html = renderToString(<App />);

    // 페이지별 meta title 생성
    let pageTitle = "React Shopping App";
    if (router.target === HomePage) {
      pageTitle = "쇼핑몰 - 홈";
    } else if (router.target === ProductDetailPage) {
      const productName = initialData?.currentProduct?.title || "상품";
      pageTitle = `${productName} - 쇼핑몰`;
    } else if (!router.target) {
      pageTitle = "404 - Page Not Found";
    }

    return {
      html,
      head: `<title>${pageTitle}</title>`,
      initialData,
    };
  } catch (error) {
    const err = error as Error;
    console.error("SSR 렌더링 오류:", error);
    console.error("Error stack:", err.stack);
    console.error("Error message:", err.message);

    // 오류 발생 시 기본 HTML 반환
    return {
      html: `<div>페이지를 불러오는 중 오류가 발생했습니다: ${err.message}</div>`,
      head: `<title>React Shopping App</title>`,
      initialData: {},
    };
  }
};
