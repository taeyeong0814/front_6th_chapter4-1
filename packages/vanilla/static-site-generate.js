import fs from "fs";
import { createServer } from "vite";
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

const { getProducts } = await vite.ssrLoadModule("./src/api/productApi.js");

// main-server.js 사용 (이미 작동하는 방식)
const mainServer = await vite.ssrLoadModule("./src/main-server.js");

async function generateStaticSite(url, query) {
  // HTML 템플릿 읽기
  const template = fs.readFileSync("./index.html", "utf-8");

  const rendered = await mainServer.render(url, query);

  const html = template
    .replace(`<!--app-head-->`, rendered.head ?? "")
    .replace(`<!--app-html-->`, rendered.html ?? "")
    .replace(
      `</head>`,
      `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData || {})};
        </script>
        </head>
      `,
    );

  if (url == "/404") {
    fs.writeFileSync("../../dist/vanilla/404.html", html);
  } else {
    if (!fs.existsSync(`../../dist/vanilla${url}`)) {
      fs.mkdirSync(`../../dist/vanilla${url}`, { recursive: true });
    }
    fs.writeFileSync(`../../dist/vanilla${url}/index.html`, html);
  }
}

const { products } = await getProducts();

// 실행
generateStaticSite("/", {});
generateStaticSite("/404", {});
for (let i = 0; i < products.length; i++) {
  generateStaticSite(`/product/${products[i].productId}`, {});
}

vite.close();
