// 라우터 import를 먼저
import { router } from "./router/router.js";

console.log("🚀 main.js 실행됨!");
console.log("라우터 객체:", router);
console.log("라우터 메서드들:", Object.getOwnPropertyNames(router));

// DOM 로드 완료 후 테스트
document.addEventListener("DOMContentLoaded", () => {
  console.log(" DOM 로드 완료!");

  // 상품 요소들 찾기
  const productItems = document.querySelectorAll(".product-item");
  console.log("📦 상품 요소들:", productItems.length + "개");

  // 각 상품에 클릭 이벤트 추가
  productItems.forEach((item, index) => {
    item.style.cursor = "pointer";
    item.style.border = "2px solid blue";

    item.addEventListener("click", () => {
      console.log(`️ 상품 ${index + 1} 클릭됨!`);

      // 라우터를 사용한 페이지 이동
      const productId = item.dataset.productId;
      if (productId) {
        console.log("상품 ID:", productId);

        // 라우터 사용 시도
        try {
          router.push(`/product/${productId}`);
          console.log("✅ 라우터로 페이지 이동 시도");
        } catch (error) {
          console.error("❌ 라우터 에러:", error);
          // 폴백: 직접 페이지 이동
          window.location.href = `/product/${productId}`;
        }
      }
    });
  });
});
