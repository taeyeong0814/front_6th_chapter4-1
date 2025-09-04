/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __spyCalls: any[];
    __spyCallsClear: () => void;
  }
}

// SSR 환경에서 window 객체 체크
if (typeof window !== "undefined") {
  window.__spyCalls = [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  // SSR 환경에서는 spyCalls 기능 무시
  if (typeof window !== "undefined") {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
