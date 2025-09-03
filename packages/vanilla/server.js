import express from "express";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

// Express 서버 설정
const app = express();

async function startServer() {
  let vite;
  let templateHtml;

  if (!prod) {
    // 개발 환경: Vite dev server + middleware
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      base,
    });
    app.use(vite.middlewares);

    // 개발용 템플릿 로드
    templateHtml = await readFile(join(__dirname, "index.html"), "utf-8");
  } else {
    // 프로덕션 환경: compression + sirv
    const compression = (await import("compression")).default;
    const sirv = (await import("sirv")).default;
    app.use(compression());
    app.use(base, sirv("./dist/vanilla", { extensions: [] }));

    // 프로덕션용 템플릿 로드
    templateHtml = await readFile(join(__dirname, "dist/vanilla/index.html"), "utf-8");
  }

  // SSR 렌더링 파이프라인 - catch-all 미들웨어로 변경
  app.use(async (req, res, next) => {
    // GET 요청만 처리
    if (req.method !== "GET") {
      return next();
    }

    try {
      const url = req.originalUrl.replace(base, "");

      let render;
      let finalTemplate;

      if (!prod) {
        // 개발 환경: Vite를 통해 실시간 변환
        finalTemplate = await vite.transformIndexHtml(req.originalUrl, templateHtml);
        render = (await vite.ssrLoadModule("/src/main-server.js")).render;
      } else {
        // 프로덕션 환경: 빌드된 파일 사용
        finalTemplate = templateHtml;
        render = (await import("./dist/vanilla-ssr/main-server.js")).render;
      }

      // 서버에서 페이지 렌더링
      const { html, head, initialData } = await render(url);

      // HTML 템플릿 치환
      const initialDataScript = `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
        </script>
      `;

      const finalHtml = finalTemplate
        .replace("<!--app-head-->", head ?? "")
        .replace("<!--app-html-->", html ?? "")
        .replace("</head>", `${initialDataScript}</head>`);

      res.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
    } catch (error) {
      if (vite) {
        vite.ssrFixStacktrace(error);
      }
      console.error("SSR Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Start http server
  app.listen(port, () => {
    console.log(`Vanilla SSR Server started at http://localhost:${port}`);
  });
}

// 서버 시작
startServer().catch(console.error);
