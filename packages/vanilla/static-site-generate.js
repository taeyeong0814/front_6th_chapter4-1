import fs from "fs";
import { createServer } from "vite";

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

const productApi = await vite.ssrLoadModule("./src/api/productApi.js");
const mainServer = await vite.ssrLoadModule("./src/main-server.js");

async function generateStaticSite(url) {
  try {
    // HTML 템플릿 읽기
    const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

    // 어플리케이션 렌더링하기
    const appHtml = await mainServer.render(url, {});

    // 결과 HTML 생성하기
    let result = template
      .replace("<!--app-head-->", appHtml.head || "")
      .replace("<!--app-html-->", appHtml.html || "")
      .replace(
        `</head>`,
        `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(appHtml.initialData || {})};
        </script>
        </head>
      `,
      );

    if (url === "/") {
      fs.writeFileSync("../../dist/vanilla/index.html", result);
    } else if (url.startsWith("/product/")) {
      // 상품 ID 추출
      const productId = url.replace("/product/", "").replace("/", "");
      const productDir = `../../dist/vanilla/product/${productId}`;

      // 디렉토리가 없으면 생성
      if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir, { recursive: true });
      }

      fs.writeFileSync(`${productDir}/index.html`, result);
    } else {
      fs.writeFileSync("../../dist/vanilla/404.html", result);
    }
  } catch (error) {
    console.error(`❌ ${url} 페이지 생성 실패:`, error.message);
  }
}

// 상품 데이터 가져오기
const products = await productApi.getProducts();

// 실행
await generateStaticSite("/");

for (const product of products.products) {
  await generateStaticSite(`/product/${product.productId}`);
}

await generateStaticSite("/404");

// Vite 서버 종료
await vite.close();

console.log("🎉 SSG 완료!");
