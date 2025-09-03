import express from "express";
import fs from "node:fs/promises";

// 환경 변수 및 상수 설정
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174; // SSR 포트
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/vanilla/" : "/");

// Express 앱 생성
const app = express();

// 템플릿과 렌더 함수 변수
let template;
let render;
let vite;

// 환경별 설정
if (!isProduction) {
  // 개발 환경: Vite 개발 서버 연동
  console.log("🛠️ 개발 환경 - Vite 설정 중...");
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  // 프로덕션 환경: 압축 및 정적 파일 서빙
  console.log("🏭 프로덕션 미들웨어 설정 중...");
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));

  // 프로덕션 템플릿 로드
  template = await fs.readFile("./dist/vanilla/index.html", "utf-8");
  render = (await import("./dist/vanilla-ssr/main-server.js")).render;
}

// SSR 렌더링 미들웨어
app.use("*all", async (req, res) => {
  try {
    // URL에서 베이스 경로 제거 (정규화)
    const url = req.originalUrl.replace(base, "");
    console.log("🌐 SSR 요청:", url);

    if (!isProduction) {
      // 개발 환경: 매 요청마다 최신 템플릿과 렌더 함수 로드
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    }

    const rendered = await render(url, req.query);

    // 초기 데이터 스크립트 생성 (Hydration용)
    const initialDataScript = rendered.initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)}</script>`
      : "";

    // HTML 템플릿에 렌더링 결과 주입
    const html = template
      .replace("<!--app-head-->", rendered.head ?? "")
      .replace("<!--app-html-->", rendered.html ?? "")
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (error) {
    // 개발 환경에서 스택 트레이스 정리
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(error);
    }

    console.error("❌ SSR 에러:", error.stack);
    res.status(500).end(error.stack);
  }
});

// HTTP 서버 시작
app.listen(port, () => {
  console.log(`🌐 SSR 서버가 http://localhost:${port} 에서 실행 중입니다`);
});
