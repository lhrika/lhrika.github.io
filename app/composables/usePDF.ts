import type { PDFPageProxy, PDFDocumentProxy } from 'pdfjs-dist'

type Lib = typeof import('pdfjs-dist')

class ReactivePDF {
	private initialized = ref(false)
	public lib: Lib | null = null
	public document = shallowRef<PDFDocumentProxy>()
	public page = shallowRef<PDFPageProxy>()

	public constructor(url?: string) {
		if (import.meta.client) {
			this.initialize()
		}
		if (url) {
			this.load(url)
		}
	}

	private async initialize() {
		if (this.initialized.value) return
		this.lib = await import('pdfjs-dist')
		this.lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
		this.initialized.value = true
	}

	public load(url: string) {
		if (this.initialized.value) {
			const loadingTask = this.lib?.getDocument(url)
			loadingTask?.promise.then(pdf => {
				this.document.value = pdf
			})
		} else {
			watch(
				this.initialized,
				() => {
					if (this.initialized.value) {
						const loadingTask = this.lib?.getDocument(url)
						loadingTask?.promise.then(pdf => {
							this.document.value = pdf
						})
					}
				},
				{ once: true },
			)
		}
	}

	public set pageNumber(value: number) {
		this.document.value?.getPage(value).then(page => {
			this.page.value = page
		})
	}
}

export const usePDF = (url?: string) => {
	const pdf = new ReactivePDF(url)
	return pdf
}
