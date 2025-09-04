import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Production 환경에서 SSG 실행
process.env.NODE_ENV = "production";

// Constants
const DIST_DIR = path.resolve(__dirname, "../../dist/react");

async function generateStaticSite() {
  try {
    // 1. 템플릿 HTML 로드
    const templatePath = path.join(DIST_DIR, "index.html");
    const template = await fs.readFile(templatePath, "utf-8");

    // 2. SSR 렌더 함수 로드
    const ssrModule = await import("./dist/react-ssr/main-server.js");
    const { render } = ssrModule;

    if (!render) {
      throw new Error("render 함수를 찾을 수 없습니다");
    }

    // 3. 생성할 페이지 목록 정의
    const pagesToGenerate = await getPages();

    // 4. 각 페이지별로 HTML 생성
    console.log(`📄 ${pagesToGenerate.length}개 페이지 생성 시작...`);

    for (const page of pagesToGenerate) {
      try {
        console.log(`🔄 생성 중: ${page.url}`);
        const rendered = await render(page.url, {});

        // 서버 데이터를 클라이언트로 전달하기 위한 스크립트 생성
        const initialDataScript = rendered.initialData
          ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)};</script>`
          : "";

        const html = template
          .replace(`<!--app-head-->`, rendered.head ?? "")
          .replace(`<!--app-html-->`, rendered.html ?? "")
          .replace(`</head>`, `${initialDataScript}</head>`);

        // HTML 파일 저장
        await saveHtmlFile(page.filePath, html);
        console.log(`✅ 생성 완료: ${page.url} -> ${page.filePath}`);
      } catch (error) {
        console.error(`❌ ${page.url} 생성 실패:`, error.message);
        console.error(`   Error stack:`, error.stack);
      }
    }

    console.log(`🎉 SSG 완료!`);
  } catch (error) {
    console.error("💥 SSG 실패:", error);
    process.exit(1);
  }
}

async function getPages() {
  const pages = [];
  const baseUrl = "/front_6th_chapter4-1/react/";

  // 홈페이지
  pages.push({
    url: baseUrl,
    filePath: path.join(DIST_DIR, "index.html"),
  });

  // 404 페이지
  pages.push({
    url: `${baseUrl}404`,
    filePath: path.join(DIST_DIR, "404.html"),
  });

  // 상품 상세 페이지들
  try {
    // 임시로 몇 개 상품 ID만 생성 (나중에 실제 데이터로 교체)
    const { mockGetProducts } = await import("./src/mocks/server.js");
    const productsData = mockGetProducts({ limit: 20 }); // 20개의 상품 가져오기

    for (const { productId } of productsData.products) {
      pages.push({
        url: `${baseUrl}product/${productId}/`,
        filePath: path.join(DIST_DIR, "product", productId, "index.html"),
      });
    }
  } catch (error) {
    console.error("상품 목록 로드 실패:", error);
  }

  return pages;
}

async function saveHtmlFile(filePath, html) {
  // 디렉토리 생성
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // HTML 파일 저장
  await fs.writeFile(filePath, html, "utf-8");
}

// 실행
generateStaticSite().catch(console.error);
