// storage.ts
import { WebStorage } from "redux-persist";

// fallback storage for server side
const createNoopStorage = (): WebStorage => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, _value) {
      return Promise.resolve();
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window !== "undefined"
    ? require("redux-persist/lib/storage").default // use real localStorage only on client
    : createNoopStorage(); // use dummy storage on server

export default storage;
