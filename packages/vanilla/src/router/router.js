// 글로벌 라우터 인스턴스
import { Router, ServerRouter } from "../lib";
import { BASE_URL } from "../constants.js";

const CurrentRouter = typeof window !== "undefined" ? Router : ServerRouter;

export const router = new CurrentRouter(BASE_URL);
