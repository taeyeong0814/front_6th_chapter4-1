import { ProductList, SearchBar } from "../components";
import { PRODUCT_ACTIONS, productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      if (typeof window === "undefined") {
        console.log("이 코드는 서버에서 실행이 되고 ");
        return;
      }
      if (window.__INITIAL_DATA__?.products?.length > 0) {
        console.log("이 코드는 클라이언트에서 실행이 되는데, __INITIAL_DATA__ 가 있을 때에만!");
        const { products, categories, totalCount } = window.__INITIAL_DATA__;
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
        return;
      }
      console.log("이 코드는 아무것도 없을 때!");
      loadProductsAndCategories();
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  (props = {}) => {
    const productState =
      props.products?.length > 0
        ? {
            products: props.products,
            loading: false,
            error: null,
            totalCount: props.totalCount,
            categories: props.categories,
          }
        : productStore.getState();
    const { search: searchQuery, limit, sort, category1, category2 } = router.query;
    const { products, loading, error, totalCount, categories } = productState;
    const category = { category1, category2 };
    const hasMore = products.length < totalCount;

    return PageWrapper({
      headerLeft: `
        <h1 class="text-xl font-bold text-gray-900">
          <a href="/" data-link>쇼핑몰</a>
        </h1>
      `.trim(),
      children: `
        <!-- 검색 및 필터 -->
        ${SearchBar({ searchQuery, limit, sort, category, categories })}
        
        <!-- 상품 목록 -->
        <div class="mb-6">
          ${ProductList({
            products,
            loading,
            error,
            totalCount,
            hasMore,
          })}
        </div>
      `.trim(),
    });
  },
);
