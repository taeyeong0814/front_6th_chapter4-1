import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import type { Product } from "./entities/index.ts";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  router.start();

  // SSR/SSG에서 전달된 initialData 확인
  const initData = (window as { __INITIAL_DATA__?: { products?: Product[]; totalCount?: number } }).__INITIAL_DATA__;

  const rootElement = document.getElementById("root")!;

  if (initData) {
    // Hydration 모드로 렌더링
    hydrateRoot(rootElement, <App />);
  } else {
    // 일반 CSR 모드로 렌더링
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
