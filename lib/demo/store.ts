// Tudo que o visitante muda no demo fica SÓ no navegador dele:
// - fotos enviadas: IndexedDB (os arquivos convertidos, como Blob);
// - fotos do demo excluídas: lista de ids no localStorage;
// - "sessão" de admin: flag no localStorage (não é segurança, é demo).
// "Restaurar demo" apaga as três coisas.

const DB_NAME = "vela-gallery-demo";
const STORE = "photos";
const DELETED_KEY = "vela-gallery-demo:deleted";
const ADMIN_KEY = "vela-gallery-demo:admin";

export type StoredPhoto = {
  id: string;
  sessionId: string;
  createdAt: number;
  width: number;
  height: number;
  thumb: Blob;
  web: Blob;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("transação abortada"));
    });
  } finally {
    db.close();
  }
}

export async function listStored(): Promise<StoredPhoto[]> {
  try {
    const rows = await run("readonly", (store) => store.getAll() as IDBRequest<StoredPhoto[]>);
    return rows.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return []; // navegação privada sem IndexedDB: o demo segue só com as fotos fixas
  }
}

export function saveStored(photo: StoredPhoto): Promise<IDBValidKey> {
  return run("readwrite", (store) => store.put(photo));
}

export function deleteStored(id: string): Promise<undefined> {
  return run("readwrite", (store) => store.delete(id));
}

function readList(key: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function deletedSeedIds(): Set<string> {
  return new Set(readList(DELETED_KEY));
}

export function markSeedDeleted(id: string): void {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set([...readList(DELETED_KEY), id])]));
  } catch {
    /* sem localStorage: a exclusão vale até recarregar */
  }
}

export function isAdmin(): boolean {
  try {
    return localStorage.getItem(ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdmin(value: boolean): void {
  try {
    if (value) localStorage.setItem(ADMIN_KEY, "1");
    else localStorage.removeItem(ADMIN_KEY);
  } catch {
    /* sem localStorage: o login não persiste */
  }
}

export async function resetDemo(): Promise<void> {
  try {
    localStorage.removeItem(DELETED_KEY);
  } catch {
    /* nada a limpar */
  }
  try {
    await run("readwrite", (store) => store.clear());
  } catch {
    /* sem IndexedDB */
  }
}
