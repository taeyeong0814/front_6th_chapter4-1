// SSR 환경에서는 mock 데이터를 사용하도록 수정
export async function getProducts(params = {}) {
  // SSR 환경 체크 (window가 undefined인 경우)
  if (typeof window === "undefined") {
    // ServerRouter의 mock 데이터 처리 함수들을 사용
    const { getProductsSSR } = await import("../lib/ServerRouter.js");
    return getProductsSSR(params);
  }

  // 클라이언트 환경에서는 기존 API 호출 유지
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  const response = await fetch(`/api/products?${searchParams}`);

  return await response.json();
}

export async function getProduct(productId) {
  // SSR 환경에서는 mock 데이터 사용
  if (typeof window === "undefined") {
    const { getProductSSR } = await import("../lib/ServerRouter.js");
    return getProductSSR(productId);
  }

  // 클라이언트 환경에서는 기존 API 호출 유지
  const response = await fetch(`/api/products/${productId}`);
  return await response.json();
}

export async function getCategories() {
  // SSR 환경에서는 mock 데이터 사용
  if (typeof window === "undefined") {
    const { getCategoriesSSR } = await import("../lib/ServerRouter.js");
    return getCategoriesSSR();
  }

  // 클라이언트 환경에서는 기존 API 호출 유지
  const response = await fetch("/api/categories");
  return await response.json();
}
