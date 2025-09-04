/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "../routers";

interface CounterState {
  count: number;
  name: string;
}

export const counterReducer = (state: CounterState, action: any): CounterState => {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1 };
    case "decrement":
      return { ...state, count: state.count - 1 };
    case "set":
      return { ...state, count: action.payload };
    case "setName":
      return { ...state, name: action.payload };
    case "reset":
      return { ...action.payload };
    default:
      return state;
  }
};

export const dataReducer = (
  state: { items: { a: number; b: number }[]; error: string; pending: boolean },
  action: any,
) => {
  switch (action.type) {
    case "addItem":
      return { ...state, items: [...state.items, action.payload] };
    case "setError":
      return { ...state, error: action.payload };
    case "setPending":
      return { ...state, pending: action.payload };
    case "set":
      return { ...action.payload };
    default:
      return state;
  }
};

export const createMockRouter = () => {
  const router = new Router();
  router.addRoute("/", () => {});
  router.addRoute("/users/:id", () => {});
  router.addRoute("/products/:category/:id", () => {});

  return router;
};
