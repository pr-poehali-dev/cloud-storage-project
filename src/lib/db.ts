// IndexedDB — файлы хранятся зашифрованными прямо в браузере
// Никакого сервера, никакой передачи данных

const DB_NAME = 'novadrive';
const DB_VERSION = 1;
const FILES_STORE = 'files';
const FOLDERS_STORE = 'folders';

export interface EncryptedFile {
  id: string;
  name: string;
  encryptedName: string;
  size: number;
  mimeType: string;
  folderId: string | null;
  createdAt: number;
  iv: string;
  ciphertext: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface LocalAccount {
  login: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        const store = db.createObjectStore(FILES_STORE, { keyPath: 'id' });
        store.createIndex('folderId', 'folderId', { unique: false });
      }
      if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
        const store = db.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
        store.createIndex('parentId', 'parentId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const req = fn(s);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFile(file: EncryptedFile): Promise<void> {
  const db = await openDB();
  await tx(db, FILES_STORE, 'readwrite', s => s.put(file));
}

export async function getFiles(folderId: string | null): Promise<EncryptedFile[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(FILES_STORE, 'readonly');
    const s = t.objectStore(FILES_STORE);
    const idx = s.index('folderId');
    const req = idx.getAll(folderId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, FILES_STORE, 'readwrite', s => s.delete(id));
}

export async function updateFile(file: EncryptedFile): Promise<void> {
  const db = await openDB();
  await tx(db, FILES_STORE, 'readwrite', s => s.put(file));
}

export async function saveFolder(folder: Folder): Promise<void> {
  const db = await openDB();
  await tx(db, FOLDERS_STORE, 'readwrite', s => s.put(folder));
}

export async function getFolders(parentId: string | null): Promise<Folder[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(FOLDERS_STORE, 'readonly');
    const s = t.objectStore(FOLDERS_STORE);
    const idx = s.index('parentId');
    const req = idx.getAll(parentId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, FOLDERS_STORE, 'readwrite', s => s.delete(id));
}

export async function getAllFilesSize(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(FILES_STORE, 'readonly');
    const s = t.objectStore(FILES_STORE);
    const req = s.getAll();
    req.onsuccess = () => {
      const total = (req.result as EncryptedFile[]).reduce((sum, f) => sum + f.size, 0);
      resolve(total);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllFilesCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(FILES_STORE, 'readonly');
    const req = t.objectStore(FILES_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function saveAccount(account: LocalAccount): void {
  localStorage.setItem('nd_account', JSON.stringify(account));
}

export function loadAccount(): LocalAccount | null {
  const raw = localStorage.getItem('nd_account');
  return raw ? JSON.parse(raw) : null;
}

export function clearAccount(): void {
  localStorage.removeItem('nd_account');
  localStorage.removeItem('nd_session');
}

export function saveSession(login: string): void {
  sessionStorage.setItem('nd_session', login);
}

export function loadSession(): string | null {
  return sessionStorage.getItem('nd_session');
}
