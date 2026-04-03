import type { PDFDocumentProxy } from 'pdfjs-dist'

type Lib = typeof import('pdfjs-dist')

const initialized = ref(false)
let lib: Lib | null = null

const initialize = async () => {
	if (initialized.value) return
	lib = await import('pdfjs-dist')
	lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
	initialized.value = true
}

const document = shallowRef<PDFDocumentProxy>()

const load = async (url: string) => {
	if (initialized.value) {
		const loadingTask = lib?.getDocument(url)
		document.value = await loadingTask?.promise
	} else {
		watch(
			initialized,
			async () => {
				if (initialized.value) {
					const loadingTask = lib?.getDocument(url)
					document.value = await loadingTask?.promise
				}
			},
			{ once: true },
		)
	}
}

export const usePDF = (url?: string) => {
	if (import.meta.client) {
		initialize()
	}
	if (url) {
		load(url)
	}
	return {
		lib,
		load,
		document,
	}
}
