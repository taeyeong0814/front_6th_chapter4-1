import { renderToString } from "react-dom/server";
import { App } from "./App";
import { router } from "./router";
import { loadHomePageData, loadProductDetailData } from "./services/ssr-data";
import { PRODUCT_ACTIONS, productStore } from "./entities";
import type { QueryPayload } from "@hanghae-plus/lib";

export const render = async (url: string, query: QueryPayload) => {
  // URL에서 쿼리 파라미터 파싱
  const urlObj = new URL(url, "http://localhost");
  const pathname = urlObj.pathname;
  const searchQuery = urlObj.searchParams.get("search") || "";
  const category1 = urlObj.searchParams.get("category1") || "";
  const category2 = urlObj.searchParams.get("category2") || "";
  const sort = urlObj.searchParams.get("sort") || "price_asc";
  const limit = parseInt(urlObj.searchParams.get("limit") || "20");

  // SSR에서도 라우터 시작 (start 메소드는 SSR 안전하게 수정됨)
  router.push(url);
  router.query = { ...query };

  // URL에 따라 필요한 데이터 미리 로드
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialData: any = {};

  try {
    // URL 패턴 기반으로 직접 분기 처리 (Universal Router)
    if (pathname === "/" || pathname === "" || pathname === "/front_6th_chapter4-1/react/") {
      // 홈페이지 - 상품 목록 데이터 로드
      const homeData = await loadHomePageData(url);
      if (homeData) {
        // 검색 및 필터링 적용
        let filteredProducts = homeData.products;

        if (searchQuery) {
          filteredProducts = filteredProducts.filter((product) =>
            product.title.toLowerCase().includes(searchQuery.toLowerCase()),
          );
        }

        if (category1) {
          filteredProducts = filteredProducts.filter((product) => product.category1 === category1);
        }

        if (category2) {
          filteredProducts = filteredProducts.filter((product) => product.category2 === category2);
        }

        // 정렬 적용
        if (sort === "price_desc") {
          filteredProducts.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
        } else if (sort === "name_asc") {
          filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === "name_desc") {
          filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
        } else {
          filteredProducts.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
        }

        // 개수 제한 적용
        filteredProducts = filteredProducts.slice(0, limit);

        // 검색 필터 정보를 포함한 initialData 생성
        initialData = {
          ...homeData,
          products: filteredProducts,
          totalCount: filteredProducts.length,
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
            products: filteredProducts,
            categories: homeData.categories,
            totalCount: filteredProducts.length,
            loading: false,
            status: "done",
            error: null,
          },
        });
      }
    } else if (pathname.startsWith("/product/") || pathname.includes("/product/")) {
      // 상품 상세 페이지 - 해당 상품 데이터 로드
      const productId = pathname.split("/product/")[1]?.replace("/", "") || "";
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
    if (pathname === "/" || pathname === "" || pathname === "/front_6th_chapter4-1/react/") {
      pageTitle = "쇼핑몰 - 홈";
    } else if (pathname.startsWith("/product/") || pathname.includes("/product/")) {
      const productName = initialData?.currentProduct?.title || "상품";
      pageTitle = `${productName} - 쇼핑몰`;
    } else if (!pathname) {
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
