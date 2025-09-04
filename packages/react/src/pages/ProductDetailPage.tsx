import { ProductDetail, useLoadProductDetail, useProductStore } from "../entities";
import { PageWrapper } from "./PageWrapper";
import { ErrorContent, PublicImage } from "../components";
import { useEffect, useState } from "react";

interface Product {
  productId: string;
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

interface ProductDetailPageProps {
  currentProduct?: Product;
  products?: Product[];
}

export const ProductDetailPage = ({ currentProduct: propProduct }: ProductDetailPageProps = {}) => {
  const { currentProduct: storeProduct, error, loading } = useProductStore();
  const [product, setProduct] = useState(propProduct || storeProduct);

  useLoadProductDetail();

  useEffect(() => {
    // SSR/SSG에서 전달된 initialData 확인
    const initialData = (window as { __INITIAL_DATA__?: { currentProduct?: Product } }).__INITIAL_DATA__;

    if (initialData) {
      if (initialData.currentProduct) {
        setProduct(initialData.currentProduct);
      }
      // initialData 사용 후 제거 (hydration 완료)
      delete (window as { __INITIAL_DATA__?: { currentProduct?: Product } }).__INITIAL_DATA__;
    } else if (propProduct) {
      // props로 전달된 데이터 사용
      setProduct(propProduct);
    }
  }, [propProduct]);

  return (
    <PageWrapper
      headerLeft={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <PublicImage src="/back-icon.svg" alt="뒤로" className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">상품 상세</h1>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 p-4">
        {loading && (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">상품 정보를 불러오는 중...</p>
            </div>
          </div>
        )}
        {error && <ErrorContent error={error} />}
        {product && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.title}</h1>
            <ProductDetail {...product} />
          </>
        )}
      </div>
    </PageWrapper>
  );
};
