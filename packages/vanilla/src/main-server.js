import { HomePage } from "./pages/HomePage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";

// 실제 상품 데이터를 가져오는 함수
async function getProductsServer() {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const data = await fs.readFile(path.join(__dirname, "mocks/items.json"), "utf-8");
    const products = JSON.parse(data);

    return products.slice(0, 20);
  } catch (error) {
    console.error("상품 데이터 로드 에러:", error);
    return [];
  }
}

export const render = async (url, query) => {
  console.log("서버 렌더링:", { url, query });

  try {
    if (url === "/" || url === "") {
      // 실제 상품 데이터를 가져와서 HomePage에 전달
      const products = await getProductsServer();
      const categories = [];
      const totalCount = products.length;

      console.log("홈페이지 렌더링:", { productsCount: products.length });

      const html = HomePage({
        products,
        categories,
        totalCount,
      });

      return {
        html: `<div id="root">${html}</div>`,
        head: "<title>쇼핑몰 홈페이지</title>",
        initialData: {
          page: "home",
          products,
          categories,
          totalCount,
        },
      };
    }

    if (url.startsWith("/product/")) {
      const productId = url.split("/")[2];

      console.log("상품 상세 페이지 렌더링:", { productId });

      // ProductDetailPage에 props 전달
      const html = ProductDetailPage({
        productId,
        url,
        query,
      });

      return {
        html: `<div id="root">${html}</div>`,
        head: "<title>상품 상세 - 쇼핑몰</title>",
        initialData: {
          page: "product",
          productId,
        },
      };
    }

    console.log("404 페이지 렌더링");

    // NotFoundPage 호출
    const html = NotFoundPage();
    return {
      html: `<div id="root">${html}</div>`,
      head: "<title>404 - 페이지 없음</title>",
      initialData: { page: "not-found", url },
    };
  } catch (error) {
    console.error("서버 렌더링 에러:", error);

    return {
      html: `
        <div id="root">
          <div class="min-h-screen bg-gray-50 flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-2xl font-bold text-gray-900 mb-4">서버 오류</h1>
              <p class="text-gray-600">잠시 후 다시 시도해주세요.</p>
            </div>
          </div>
        </div>
      `,
      head: "<title>서버 오류 - 쇼핑몰</title>",
      initialData: { page: "error", error: error.message },
    };
  }
};
