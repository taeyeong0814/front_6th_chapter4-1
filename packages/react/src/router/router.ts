// 글로벌 라우터 인스턴스
import { MemoryRouter, Router } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

const CurrentRouter = typeof window !== "undefined" ? Router : MemoryRouter;

export const router = new CurrentRouter<FunctionComponent>(BASE_URL);
