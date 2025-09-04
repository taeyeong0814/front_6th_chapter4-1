import { BaseRouter, type QueryPayload } from "./BaseRouter";
import type { AnyFunction, StringRecord } from "../types";

export type RouterInstance<T extends AnyFunction> = InstanceType<typeof Router<T>>;

export class Router<Handler extends AnyFunction> extends BaseRouter<Handler> {
  constructor(baseUrl = "") {
    super(baseUrl);

    // SSR 환경에서는 window/document 이벤트 리스너 추가하지 않음
    window.addEventListener("popstate", () => {
      this.setRoute(this.findRoute());
      this.notify();
    });

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!target?.closest("[data-link]")) {
        return;
      }
      e.preventDefault();
      const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
      if (url) {
        this.push(url);
      }
    });
  }

  get query(): StringRecord {
    if (typeof window === "undefined") return {};
    return Router.parseQuery(window.location.search);
  }

  set query(newQuery: QueryPayload) {
    const newUrl = this.getUrl(newQuery);
    this.push(newUrl);
  }

  get pathname(): string {
    if (typeof window === "undefined") return "/";
    return window.location.pathname;
  }

  push(url: string) {
    try {
      const fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);
      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.setRoute(this.findRoute(fullUrl.split("?")[0]));
      this.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  private getUrl(newQuery: QueryPayload) {
    const currentQuery = this.query;
    const updatedQuery = { ...currentQuery, ...newQuery };

    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery);
    const pathname = this.pathname.replace(this.baseUrl, "");
    return `${this.baseUrl}${pathname}${queryString ? `?${queryString}` : ""}`;
  }
}
