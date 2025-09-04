import { createObserver } from "../createObserver";
import type { AnyFunction, StringRecord } from "../types";

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

export type QueryPayload = Record<string, string | number | undefined>;

export abstract class BaseRouter<Handler extends AnyFunction> {
  readonly #routes: Map<string, Route<Handler>>;
  readonly #observer = createObserver();
  readonly #baseUrl: string;

  #route: null | (Route<Handler> & { params: StringRecord; path: string });

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  // 추상 메서드들 - 구현체에서 반드시 구현해야 함
  abstract get query(): StringRecord;
  abstract set query(newQuery: QueryPayload);
  abstract get pathname(): string;
  abstract push(url: string): void;

  // 공통 getter들
  get params() {
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get routes() {
    return this.#routes;
  }

  // 공통 메서드들
  readonly subscribe = this.#observer.subscribe;

  addRoute(path: string, handler: Handler) {
    const paramNames: string[] = [];
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

  start() {
    this.#route = this.findRoute();
    this.#observer.notify();
  }

  // protected 메서드들 - 하위 클래스에서 사용
  protected findRoute(pathname?: string): null | (Route<Handler> & { params: StringRecord; path: string }) {
    const targetPathname = pathname ?? this.pathname;

    for (const [routePath, route] of this.#routes) {
      const match = targetPathname.match(route.regex);
      if (!match) {
        continue;
      }

      const params: StringRecord = {};
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });

      return {
        ...route,
        params,
        path: routePath,
      };
    }
    return null;
  }

  protected setRoute(route: null | (Route<Handler> & { params: StringRecord; path: string })) {
    this.#route = route;
  }

  protected notify() {
    this.#observer.notify();
  }

  // 정적 메서드들
  static parseQuery = (search?: string) => {
    const params = new URLSearchParams(search || "");
    const query: StringRecord = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  static stringifyQuery = (query: QueryPayload) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };
}
