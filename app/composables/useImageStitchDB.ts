const DB_NAME = 'image-stitch'
const STORE_NAME = 'blobs'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION)
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE_NAME)) {
				req.result.createObjectStore(STORE_NAME)
			}
		}
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
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
		const db = await openDB()
		await tx(db, 'readwrite', store => store.put(blob, id))
		db.close()
	}

	async function loadBlob(id: string): Promise<Blob | null> {
		const db = await openDB()
		const result = (await tx(db, 'readonly', store => store.get(id))) as Blob | undefined
		db.close()
		return result ?? null
	}

	async function getAllIds(): Promise<string[]> {
		const db = await openDB()
		const result = (await tx(db, 'readonly', store => store.getAllKeys())) as string[]
		db.close()
		return result
	}

	async function deleteBlobs(ids: string[]): Promise<void> {
		if (ids.length === 0) return
		const db = await openDB()
		const t = db.transaction(STORE_NAME, 'readwrite')
		const store = t.objectStore(STORE_NAME)
		await Promise.all(
			ids.map(id => new Promise<void>((resolve, reject) => {
				const req = store.delete(id)
				req.onsuccess = () => resolve()
				req.onerror = () => reject(req.error)
			})),
		)
		db.close()
	}

	async function clearAll(): Promise<void> {
		const db = await openDB()
		await tx(db, 'readwrite', store => store.clear())
		db.close()
	}

	return { saveBlob, loadBlob, getAllIds, deleteBlobs, clearAll }
}
