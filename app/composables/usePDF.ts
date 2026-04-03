import type { PDFPageProxy, PDFDocumentProxy } from 'pdfjs-dist'

type Lib = typeof import('pdfjs-dist')

class ReactivePDF {
	private initialized = ref(false)
	public lib: Lib | null = null
	public document = shallowRef<PDFDocumentProxy>()
	public page = shallowRef<PDFPageProxy>()
	public pageNumber = ref(1)

	public constructor(url?: string, initialPage: number = 1) {
		if (import.meta.client) {
			this.initialize()
			this.pageNumber.value = initialPage
			watch(this.pageNumber, value => {
				this.loadPage(value)
			})
		}
		if (url) {
			this.load(url)
		}
	}

	private loadPage(p: number) {
		this.document.value?.getPage(p).then(page => {
			this.page.value = page
		})
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
				this.loadPage(this.pageNumber.value)
			})
		} else {
			watch(
				this.initialized,
				() => {
					if (this.initialized.value) {
						const loadingTask = this.lib?.getDocument(url)
						loadingTask?.promise.then(pdf => {
							this.document.value = pdf
							this.loadPage(this.pageNumber.value)
						})
					}
				},
				{ once: true },
			)
		}
	}

	public renderPage(canvas: HTMLCanvasElement, scale: number = 1) {
		const page = this.page.value
		if (!page) return
		const dpr = window.devicePixelRatio || 1
		const viewport = page.getViewport({ scale: scale })
		canvas.width = Math.ceil(viewport.width * dpr)
		canvas.height = Math.ceil(viewport.height * dpr)
		canvas.style.width = `${Math.ceil(viewport.width)}px`
		canvas.style.height = `${Math.ceil(viewport.height)}px`
		const task = page.render({
			canvas,
			viewport,
			transform: [dpr, 0, 0, dpr, 0, 0],
		})
		return task
	}

	public renderPageRegion(
		canvas: HTMLCanvasElement,
		x: number,
		y: number,
		width: number,
		height: number,
		scale: number = 1,
	) {
		const page = this.page.value
		if (!page) return
		const dpr = window.devicePixelRatio || 1
		const viewport = page.getViewport({ scale })
		// PDF space region -> viewport space
		const [x1, y1, x2, y2] = viewport.convertToViewportRectangle([
			x,
			y,
			x + width,
			y + height,
		])
		const cropX = Math.min(x1, x2)
		const cropY = Math.min(y1, y2)
		const cropWidth = Math.abs(x2 - x1)
		const cropHeight = Math.abs(y2 - y1)

		canvas.width = Math.ceil(cropWidth * dpr)
		canvas.height = Math.ceil(cropHeight * dpr)
		canvas.style.width = `${Math.ceil(cropWidth)}px`
		canvas.style.height = `${Math.ceil(cropHeight)}px`

		return page.render({
			canvas,
			viewport,
			transform: [dpr, 0, 0, dpr, -cropX * dpr, -cropY * dpr],
		})
	}
}

export const usePDF = (url?: string) => {
	const pdf = new ReactivePDF(url)
	return pdf
}
