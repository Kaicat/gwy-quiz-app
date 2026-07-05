const DB_NAME = 'gwy-quiz', DB_VER = 1;
const STORES = ['questions', 'wrongBook', 'favorites', 'progress', 'essayDrafts', 'videos', 'meta'];

export function openKV() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      for (const s of STORES)
        if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s);
    };
    req.onsuccess = () => resolve(new IdbKV(req.result));
    req.onerror = () => reject(req.error);
  });
}

class IdbKV {
  constructor(db) { this.db = db; }
  #req(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, mode);
      const r = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(r && 'result' in r ? r.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  get(s, k) { return this.#req(s, 'readonly', os => os.get(k)); }
  put(s, k, v) { return this.#req(s, 'readwrite', os => os.put(v, k)); }
  del(s, k) { return this.#req(s, 'readwrite', os => os.delete(k)); }
  getAll(s) { return this.#req(s, 'readonly', os => os.getAll()); }
  clear(s) { return this.#req(s, 'readwrite', os => os.clear()); }
  bulkPut(s, entries) {
    return this.#req(s, 'readwrite', os => { for (const [k, v] of entries) os.put(v, k); });
  }
}
