/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage
 * @returns {Object} { get, set, reset }
 */

// 서버용 메모리 스토리지
const createServerStorage = (key) => {
  const memoryStorage = new Map();

  const get = () => memoryStorage.get(key) || null;
  const set = (value) => memoryStorage.set(key, value);
  const reset = () => memoryStorage.delete(key);

  return { get, set, reset };
};

// 클라이언트용 로컬 스토리지
const createClientStorage = (key, storage) => {
  const actualStorage = storage || (typeof window !== "undefined" ? window.localStorage : null);

  if (!actualStorage) {
    console.warn("Storage not available, using memory storage");
    return createServerStorage(key);
  }

  const get = () => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};

// 환경에 따라 적절한 스토리지 선택
export const createStorage = (key, storage) => {
  // 서버 환경 감지 (Node.js)
  if (typeof global !== "undefined" && global.process && global.process.versions && global.process.versions.node) {
    return createServerStorage(key);
  }

  // 클라이언트 환경
  return createClientStorage(key, storage);
};
