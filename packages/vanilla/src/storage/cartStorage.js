import { createStorage } from "../lib";

const storage =
  typeof window !== "undefined"
    ? window.localStorage
    : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };

export const cartStorage = createStorage("shopping_cart", storage);
