// ===== 간단한 라우터 =====
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";
import { getProductsOnServer, getUniqueCategories } from "./mocks/server.js";
import { PRODUCT_ACTIONS, productStore } from "./stores";

// ===== 라우트 등록 =====
router.addRoute("/", () => {
  const {
    products,
    pagination: { total: totalCount },
  } = getProductsOnServer(router.query);
  const categories = getUniqueCategories();

  const results = {
    products,
    categories,
    totalCount,
  };

  // initialData에 검색 쿼리와 필터 정보도 포함
  const initialData = {
    ...results,
    filters: {
      search: router.query.search || "",
      category1: router.query.category1 || "",
      category2: router.query.category2 || "",
      sort: router.query.sort || "price_asc",
      limit: router.query.limit || 20,
    },
  };

  return {
    initialData,
    html: HomePage(results),
    head: generateHead(router.query),
  };
});

router.addRoute("/product/:id/", () => {
  const { id } = router.params;
  const product = getProductOnServer(id);

  if (!product) {
    return {
      initialData: { error: "Product not found" },
      html: NotFoundPage(),
      head: "<title>상품을 찾을 수 없습니다 - 쇼핑몰</title>",
    };
  }

  // 관련 상품 데이터 가져오기 (같은 카테고리의 다른 상품들)
  const { products: allProducts } = getProductsOnServer({});
  const relatedProducts = allProducts
    .filter((p) => p.productId !== id && p.category1 === product.category1)
    .slice(0, 4); // 최대 4개까지만

  const results = {
    currentProduct: product,
    products: relatedProducts, // 관련 상품 데이터 포함
  };

  // SSR에서 상품 데이터를 props로 전달
  return {
    initialData: results,
    html: ProductDetailPage(results),
    head: generateProductHead(product),
  };
});

router.addRoute(".*", () => {
  return {
    initialData: {},
    html: NotFoundPage(),
    head: "<title>페이지 없음 - 쇼핑몰</title>",
  };
});

// ===== 헤드 메타데이터 생성 함수 =====
function generateHead(query = {}) {
  let title = "쇼핑몰 - 홈";

  if (query.search) {
    title = `${query.search} 검색 결과 - ${title}`;
  } else if (query.category1) {
    title = `${query.category1} - ${title}`;
  }

  return `<title>${title}</title>`;
}

function generateProductHead(product) {
  return `<title>${product.title} - 쇼핑몰</title>`;
}

// ===== 상품 상세 데이터 가져오기 =====
function getProductOnServer(id) {
  // server.js에서 상품 데이터 가져오기
  const { products } = getProductsOnServer({});
  return products.find((p) => p.productId === id);
}

// ===== 메인 렌더 함수 =====
export const render = async (url, query) => {
  try {
    // URL에서 경로 부분만 추출 (쿼리 파라미터 제외)
    const urlObj = new URL(url, "http://localhost");
    let pathname = urlObj.pathname;

    // base URL 제거 (예: /front_6th_chapter4-1/vanilla/ -> /)
    if (pathname.startsWith("/front_6th_chapter4-1/vanilla")) {
      pathname = pathname.replace("/front_6th_chapter4-1/vanilla", "");
    }
    if (pathname.startsWith("/front_6th_chapter4-1/react")) {
      pathname = pathname.replace("/front_6th_chapter4-1/react", "");
    }

    // 빈 경로는 루트로 처리
    if (pathname === "" || pathname === "/") {
      pathname = "/";
    }

    // 라우터 초기화 및 쿼리 설정
    router.setUrl(pathname, "http://localhost");
    router.query = query;
    router.start();

    // 라우트 찾기 - pathname 대신 전체 URL 사용
    const routeInfo = router.findRoute(url);

    if (!routeInfo || !routeInfo.handler) {
      console.error("❌ 라우트를 찾을 수 없음:", pathname);
      return {
        head: "<title>페이지 없음</title>",
        html: "<div>페이지를 찾을 수 없습니다.</div>",
        initialData: { error: "Route not found" },
      };
    }

    // 서버 상태 초기화
    await initializeServerState(routeInfo, query);

    const result = await routeInfo.handler(routeInfo.params);
    return result;
  } catch (error) {
    console.error("❌ SSR 에러:", error);
    return {
      head: "<title>에러</title>",
      html: "<div>서버 오류가 발생했습니다.</div>",
      initialData: { error: error.message },
    };
  }
};

// ===== 서버 상태 초기화 =====
async function initializeServerState(routeInfo, query) {
  try {
    if (routeInfo.path === "/") {
      // 홈페이지: 상품 목록과 카테고리 데이터 프리페칭
      const {
        products,
        pagination: { total: totalCount },
      } = getProductsOnServer(query);
      const categories = getUniqueCategories();

      // 서버 상태 초기화 (클라이언트와 동일한 구조)
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products,
          categories,
          totalCount,
          loading: false,
          status: "done",
        },
      });
    } else if (routeInfo.path === "/product/:id/") {
      // 상품 상세: 현재 상품 데이터 설정
      const { id } = routeInfo.params;
      const product = getProductOnServer(id);

      if (product) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
          payload: product,
        });
      }
    }
  } catch (error) {
    console.error("❌ 서버 상태 초기화 실패:", error);
  }
}
