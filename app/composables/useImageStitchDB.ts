const DB_NAME = 'image-stitch'
const STORE_NAME = 'blobs'
const DB_VERSION = 1

// Singleton DB connection — opened once, reused across all operations.
let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
	if (!dbPromise) {
		dbPromise = new Promise((resolve, reject) => {
			const req = indexedDB.open(DB_NAME, DB_VERSION)
			req.onupgradeneeded = () => {
				if (!req.result.objectStoreNames.contains(STORE_NAME)) {
					req.result.createObjectStore(STORE_NAME)
				}
			}
			req.onsuccess = () => resolve(req.result)
			req.onerror = () => {
				dbPromise = null
				reject(req.error)
			}
		})
	}
	return dbPromise
}

function tx(
	db: IDBDatabase,
	mode: IDBTransactionMode,
	fn: (store: IDBObjectStore) => IDBRequest,
): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const t = db.transaction(STORE_NAME, mode)
		const req = fn(t.objectStore(STORE_NAME))
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
}

export function useImageStitchDB() {
	async function saveBlob(id: string, blob: Blob): Promise<void> {
		const db = await getDB()
		await tx(db, 'readwrite', store => store.put(blob, id))
	}

	async function loadBlob(id: string): Promise<Blob | null> {
		const db = await getDB()
		const result = (await tx(db, 'readonly', store => store.get(id))) as Blob | undefined
		return result instanceof Blob ? result : null
	}

	async function getAllIds(): Promise<string[]> {
		const db = await getDB()
		return (await tx(db, 'readonly', store => store.getAllKeys())) as string[]
	}

	async function deleteBlobs(ids: string[]): Promise<void> {
		if (ids.length === 0) return
		const db = await getDB()
		const t = db.transaction(STORE_NAME, 'readwrite')
		const store = t.objectStore(STORE_NAME)
		await Promise.all(
			ids.map(
				id =>
					new Promise<void>((resolve, reject) => {
						const req = store.delete(id)
						req.onsuccess = () => resolve()
						req.onerror = () => reject(req.error)
					}),
			),
		)
	}

	async function clearAll(): Promise<void> {
		const db = await getDB()
		await tx(db, 'readwrite', store => store.clear())
	}

	return { saveBlob, loadBlob, getAllIds, deleteBlobs, clearAll }
}
