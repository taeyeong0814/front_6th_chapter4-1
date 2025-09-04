import { renderToString } from "react-dom/server";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages/index";
import items from "./mocks/items.json";

// ===== 메인 렌더링 함수 =====
export async function render(url: string) {
  try {
    const pathname = url.replace(/^\/+/, "/");

    // 홈페이지
    if (pathname === "/" || pathname === "") {
      const initialData = {
        products: items.slice(0, 20), // 처음 20개 상품
        categories: getUniqueCategories(),
        totalCount: items.length,
      };

      return {
        initialData,
        html: renderToString(<HomePage products={items.slice(0, 20)} totalCount={items.length} />),
        head: "<title>쇼핑몰 - 홈</title>",
      };
    }

    // 상품 상세 페이지
    const productIdMatch = pathname.match(/^\/product\/([^/]+)\/?$/);
    if (productIdMatch) {
      const id = productIdMatch[1];
      const product = items.find((p) => p.productId === id);

      if (!product) {
        return {
          initialData: { error: "Product not found" },
          html: renderToString(<NotFoundPage />),
          head: "<title>상품을 찾을 수 없습니다 - 쇼핑몰</title>",
        };
      }

      const initialData = {
        currentProduct: product,
        products: items.filter((p) => p.productId !== id).slice(0, 4), // 관련 상품 4개
      };

      return {
        initialData,
        html: renderToString(
          <ProductDetailPage currentProduct={product} products={items.filter((p) => p.productId !== id).slice(0, 4)} />,
        ),
        head: `<title>${product.title} - 쇼핑몰</title>`,
      };
    }

    // 404 페이지
    return {
      initialData: {},
      html: renderToString(<NotFoundPage />),
      head: "<title>페이지 없음 - 쇼핑몰</title>",
    };
  } catch (error) {
    console.error("❌ SSR 에러:", error);
    return {
      head: "<title>에러</title>",
      html: renderToString(<NotFoundPage />),
      initialData: { error: (error as Error).message },
    };
  }
}

// 카테고리 추출 함수
function getUniqueCategories() {
  const categories: Record<string, Record<string, string | undefined>> = {};

  items.forEach((item: { category1: string; category2: string }) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = undefined;
  });

  return categories;
}
