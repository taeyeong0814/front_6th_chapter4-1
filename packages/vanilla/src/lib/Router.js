/**
 * 클라이언트사이드 SPA 라우터
 */
import { BaseRouter } from "./BaseRouter.js";

export class Router extends BaseRouter {
  constructor(baseUrl = "") {
    super(baseUrl);

    window.addEventListener("popstate", () => {
      this.updateRoute(this.getCurrentUrl());
    });
  }

  get query() {
    return BaseRouter.parseQuery(window.location.search);
  }

  set query(newQuery) {
    const newUrl = BaseRouter.getUrl(newQuery, this.baseUrl, window.location.pathname, window.location.search);
    this.push(newUrl);
  }

  getCurrentUrl() {
    return `${window.location.pathname}${window.location.search}`;
  }

  getOrigin() {
    return window.location.origin;
  }

  /**
   * 네비게이션 실행
   */
  push(url) {
    try {
      let fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.updateRoute(fullUrl);
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 라우터 시작
   */
  start() {
    this.updateRoute(this.getCurrentUrl());
  }
}
