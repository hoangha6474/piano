import type { StateStorage } from "zustand/middleware";
let database: Promise<IDBDatabase> | undefined;
function open() {
  return (database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("piano-learning", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("workspace");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = undefined;
      reject(request.error);
    };
    request.onblocked = () => {
      database = undefined;
      reject(new Error("Kho dữ liệu đang bị khóa ở thẻ khác."));
    };
  }));
}
async function operation<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("workspace", mode),
      request = action(transaction.objectStore("workspace"));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
function report() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("piano-storage-error"));
}
export const durableStorage: StateStorage = {
  async getItem(key) {
    try {
      const saved = await operation<string | undefined>("readonly", (s) =>
        s.get(key),
      );
      return saved ?? localStorage.getItem(key);
    } catch {
      report();
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },
  async setItem(key, value) {
    try {
      await operation("readwrite", (s) => s.put(value, key));
    } catch {
      try {
        localStorage.setItem(key, value);
      } catch {
        report();
      }
    }
  },
  async removeItem(key) {
    await operation("readwrite", (s) => s.delete(key));
    localStorage.removeItem(key);
  },
};
