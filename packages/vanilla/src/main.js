import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
