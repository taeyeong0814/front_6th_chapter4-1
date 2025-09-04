import fs from "fs";
import { createServer } from "vite";
import items from "./src/mocks/items.json";

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

// main-server.tsx 사용
const mainServer = await vite.ssrLoadModule("./src/main-server.tsx");

async function generateStaticSite(url) {
  // HTML 템플릿 읽기
  const template = fs.readFileSync("./index.html", "utf-8");

  const rendered = await mainServer.render(url);

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

  if (url === "/404") {
    fs.writeFileSync("../../dist/react/404.html", html);
  } else {
    if (!fs.existsSync(`../../dist/react${url}`)) {
      fs.mkdirSync(`../../dist/react${url}`, { recursive: true });
    }
    fs.writeFileSync(`../../dist/react${url}/index.html`, html);
  }
}

// 실행
generateStaticSite("/");
generateStaticSite("/404");

// 실제 상품 데이터로 상품 상세 페이지 생성
for (let i = 0; i < Math.min(items.length, 20); i++) {
  // 처음 20개만
  generateStaticSite(`/product/${items[i].productId}`);
}

vite.close();
