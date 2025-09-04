import fs from "node:fs/promises";
import express from "express";

// Constants
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174; // React용 포트 (vanilla과 구분)
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/react/" : "/");

// Cached production assets
const templateHtml = prod ? await fs.readFile("./dist/react/index.html", "utf-8") : "";

// Create http server
const app = express();

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

// Root redirect for convenience
if (prod && base !== "/") {
  app.get("/", (req, res) => {
    res.redirect(base);
  });
}

// Serve HTML
app.use(async (req, res) => {
  try {
    const url = req.originalUrl;
    const query = req.query;

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.tsx').render} */
    let render;
    if (!prod) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }

    const rendered = await render(url, query);

    // 서버 데이터를 클라이언트로 전달하기 위한 스크립트 생성
    const initialDataScript = rendered.initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)};</script>`
      : "";

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(`</head>`, `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
