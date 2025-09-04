import { useEffect, useState } from "react";
import { loadNextProducts, loadProductsAndCategories, ProductList, SearchBar, type Product } from "../entities";
import { PageWrapper } from "./PageWrapper";

const headerLeft = (
  <h1 className="text-xl font-bold text-gray-900">
    <a href="/" data-link="/">
      쇼핑몰
    </a>
  </h1>
);

// 무한 스크롤 이벤트 등록
let scrollHandlerRegistered = false;

const registerScrollHandler = () => {
  if (scrollHandlerRegistered) return;

  window.addEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = true;
};

const unregisterScrollHandler = () => {
  if (!scrollHandlerRegistered) return;
  window.removeEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = false;
};

interface HomePageProps {
  products?: Product[];
  totalCount?: number;
}

export const HomePage = ({ products: propProducts, totalCount: propTotalCount }: HomePageProps = {}) => {
  const [, setSsrData] = useState({ products: propProducts, totalCount: propTotalCount });

  useEffect(() => {
    // SSR/SSG에서 전달된 initialData 확인
    const initialData = (window as { __INITIAL_DATA__?: { products?: Product[]; totalCount?: number } })
      .__INITIAL_DATA__;

    if (initialData) {
      setSsrData({
        products: initialData.products || propProducts,
        totalCount: initialData.totalCount || propTotalCount,
      });
      // initialData 사용 후 제거 (hydration 완료)
      delete (window as { __INITIAL_DATA__?: { products?: Product[]; totalCount?: number } }).__INITIAL_DATA__;
    }

    // CSR 로직 실행 (기존 로직 유지)
    registerScrollHandler();
    loadProductsAndCategories();

    return unregisterScrollHandler;
  }, [propProducts, propTotalCount]);

  return (
    <PageWrapper headerLeft={headerLeft}>
      {/* 검색 및 필터 */}
      <SearchBar />

      {/* 상품 목록 */}
      <div className="mb-6">
        <ProductList />
      </div>
    </PageWrapper>
  );
};
