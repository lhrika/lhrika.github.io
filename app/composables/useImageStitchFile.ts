import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate'
import type { StitchImageMeta } from '~/stores/imageStitch'

// File System Access API — available in Chrome/Edge but not in all TS lib versions
interface FSAPickerType { description?: string; accept: Record<string, string[]> }
interface WithSaveFilePicker {
	showSaveFilePicker(opts?: { suggestedName?: string; types?: FSAPickerType[] }): Promise<FileSystemFileHandle>
}
interface WithOpenFilePicker {
	showOpenFilePicker(opts?: { types?: FSAPickerType[]; multiple?: boolean }): Promise<FileSystemFileHandle[]>
}

const FILE_EXT = 'stitch'
const MIME_TYPE = 'application/octet-stream'
const MANIFEST_VERSION = 1

interface StitchManifest {
	version: number
	canvasWidth: number
	canvasHeight: number
	canvasBg: string
	images: (StitchImageMeta & { ext: string })[]
}

function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
	return blob.arrayBuffer().then(buf => new Uint8Array(buf))
}

function extFromMime(mime: string): string {
	if (mime === 'image/jpeg') return 'jpg'
	if (mime === 'image/webp') return 'webp'
	if (mime === 'image/gif') return 'gif'
	return 'png'
}

function mimeFromExt(ext: string): string {
	if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
	if (ext === 'webp') return 'image/webp'
	if (ext === 'gif') return 'image/gif'
	return 'image/png'
}

export function useImageStitchFile() {
	const db = useImageStitchDB()

	// ---- Save ----
	async function buildZip(
		metas: StitchImageMeta[],
		canvasWidth: number,
		canvasHeight: number,
		canvasBg: string,
	): Promise<Uint8Array> {
		const files: Record<string, Uint8Array> = {}

		const manifestImages: StitchManifest['images'] = []

		for (const meta of metas) {
			const blob = await db.loadBlob(meta.id)
			if (!blob) continue
			const ext = extFromMime(blob.type || 'image/png')
			const filename = `images/${meta.id}.${ext}`
			files[filename] = await blobToUint8Array(blob)
			manifestImages.push({ ...meta, ext })
		}

		const manifest: StitchManifest = {
			version: MANIFEST_VERSION,
			canvasWidth,
			canvasHeight,
			canvasBg,
			images: manifestImages,
		}
		files['manifest.json'] = strToU8(JSON.stringify(manifest, null, 2))

		return zipSync(files, { level: 0 }) // level 0 = store only (images are already compressed)
	}

	async function saveFile(
		metas: StitchImageMeta[],
		canvasWidth: number,
		canvasHeight: number,
		canvasBg: string,
	): Promise<void> {
		const zip = await buildZip(metas, canvasWidth, canvasHeight, canvasBg)
		const blob = new Blob([zip.buffer as ArrayBuffer], { type: MIME_TYPE })

		// Try File System Access API first (shows native save dialog)
		if ('showSaveFilePicker' in window) {
			try {
				const handle = await (window as Window & WithSaveFilePicker).showSaveFilePicker({
					suggestedName: `project.${FILE_EXT}`,
					types: [{ description: 'Stitch Project', accept: { [MIME_TYPE]: [`.${FILE_EXT}`] } }],
				})
				const writable = await handle.createWritable()
				await writable.write(blob)
				await writable.close()
				return
			} catch (e: unknown) {
				// User cancelled or API unavailable — fall through to download
				if ((e as DOMException)?.name === 'AbortError') return
			}
		}

		// Fallback: trigger download
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `project.${FILE_EXT}`
		a.click()
		URL.revokeObjectURL(url)
	}

	// ---- Open ----
	interface LoadedProject {
		canvasWidth: number
		canvasHeight: number
		canvasBg: string
		images: (StitchImageMeta & { blob: Blob })[]
	}

	async function parseZip(file: File): Promise<LoadedProject> {
		const buf = await file.arrayBuffer()
		const entries = unzipSync(new Uint8Array(buf))

		const manifestRaw = entries['manifest.json']
		if (!manifestRaw) throw new Error('Invalid .stitch file: missing manifest.json')

		const manifest = JSON.parse(strFromU8(manifestRaw)) as StitchManifest

		const images: LoadedProject['images'] = []
		for (const imgMeta of manifest.images) {
			const filename = `images/${imgMeta.id}.${imgMeta.ext}`
			const data = entries[filename]
			if (!data) continue
			const blob = new Blob([data], { type: mimeFromExt(imgMeta.ext) })
			const { ext: _ext, ...meta } = imgMeta
			images.push({ ...meta, blob })
		}

		return {
			canvasWidth: manifest.canvasWidth,
			canvasHeight: manifest.canvasHeight,
			canvasBg: manifest.canvasBg,
			images,
		}
	}

	async function openFile(file: File): Promise<LoadedProject> {
		return parseZip(file)
	}

	async function pickAndOpen(): Promise<LoadedProject | null> {
		// Try File System Access API
		if ('showOpenFilePicker' in window) {
			try {
				const handles = await (window as Window & WithOpenFilePicker).showOpenFilePicker({
					types: [{ description: 'Stitch Project', accept: { [MIME_TYPE]: [`.${FILE_EXT}`] } }],
				})
				const handle = handles[0]
				if (!handle) return null
				const file = await handle.getFile()
				return parseZip(file)
			} catch (e: unknown) {
				if ((e as DOMException)?.name === 'AbortError') return null
			}
		}
		return null // Caller should fall back to <input type=file>
	}

	return { saveFile, openFile, pickAndOpen }
}
