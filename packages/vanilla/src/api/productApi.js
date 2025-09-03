import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function getProducts(params = {}) {
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
  const response = await fetch(`/api/products/${productId}`);
  return await response.json();
}

export async function getCategories() {
  const response = await fetch("/api/categories");
  return await response.json();
}

// 새로 추가: 서버용 함수들
export async function getProductsServer() {
  try {
    const data = await readFile(join(__dirname, "../mocks/items.json"), "utf-8");
    const products = JSON.parse(data);
    return products.slice(0, 20); // 처음 20개만 반환
  } catch (error) {
    console.error("서버 API 에러:", error);
    return [];
  }
}

export async function getProductServer(productId) {
  try {
    const products = await getProductsServer();
    return products.find((p) => p.productId === productId);
  } catch (error) {
    console.error("상품 조회 에러:", error);
    return null;
  }
}
