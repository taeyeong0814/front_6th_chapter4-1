/**
 * 기본 라우터 - 공통 기능을 제공하는 추상 클래스
 */
import { createObserver } from "./createObserver.js";

export class BaseRouter {
  #routes;
  #route;
  #observer = createObserver();
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  subscribe(fn) {
    this.#observer.subscribe(fn);
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  findRoute(url) {
    const { pathname } = new URL(url, this.getOrigin());
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }
    return null;
  }

  updateRoute(url) {
    this.#route = this.findRoute(url);
    this.#observer.notify();
  }

  // 추상 메서드들 - 하위 클래스에서 구현 필요
  getCurrentUrl() {
    throw new Error("getCurrentUrl must be implemented by subclass");
  }

  getOrigin() {
    throw new Error("getOrigin must be implemented by subclass");
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   */
  static parseQuery(search) {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }

  /**
   * 객체를 쿼리 문자열로 변환
   */
  static stringifyQuery(query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  }

  static getUrl(newQuery, baseUrl = "", pathname = "", search = "") {
    const currentQuery = BaseRouter.parseQuery(search);
    const updatedQuery = { ...currentQuery, ...newQuery };

    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = BaseRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  }
}
