import type { PDFPageProxy, PDFDocumentProxy } from 'pdfjs-dist'

type Lib = typeof import('pdfjs-dist')

class ReactivePDF {
	private initialized = ref(false)
	public lib: Lib | null = null
	public url = ref('')
	public document = shallowRef<PDFDocumentProxy>()
	public page = shallowRef<PDFPageProxy>()
	public pageNumber = ref(1)
	public pageBounding = shallowRef({
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		width: 0,
		height: 0,
	})
	public contentBounding = shallowRef({
		top: 0,
		left: 0,
		bottom: 0,
		right: 0,
		width: 0,
		height: 0,
	})

	public constructor(url?: string, initialPage: number = 1) {
		if (import.meta.client) {
			this.initialize()
			this.pageNumber.value = initialPage
		}
		watch(this.url, value => {
			this.load(value)
		})
		if (url) {
			this.url.value = url
		}
	}

	public setPage(value: number) {
		this.loadPage(value)
		this.pageNumber.value = value
	}

	private loadPage(p: number) {
		this.document.value?.getPage(p).then(page => {
			this.page.value = page
			const [minX = 0, minY = 0, maxX = 0, maxY = 0] = page.view
			this.pageBounding.value = {
				left: minX,
				right: maxX,
				top: maxY,
				bottom: minY,
				width: maxX - minX,
				height: maxY - minY,
			}
			this.contentBounding.value = {
				...this.pageBounding.value,
			}
		})
	}

	public detectContentBounding = async (
		color: string = '#FFFFFF',
		tolerance: number = 5,
		marginX: number = 0,
		marginY: number = 0,
	) => {
		const page = this.page.value
		if (!page) {
			return {
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				width: 0,
				height: 0,
			}
		}
		const viewport = page.getViewport({ scale: 1 })

		const tmp = document.createElement('canvas')
		const w = Math.ceil(viewport.width)
		const h = Math.ceil(viewport.height)
		tmp.width = w
		tmp.height = h
		await page.render({
			canvas: tmp,
			viewport,
		}).promise
		const ctx = tmp.getContext('2d')
		const img = ctx?.getImageData(0, 0, w, h)
		const data = img?.data
		if (!data) return this.pageBounding.value

		let left = w
		let right = 0
		let top = 0
		let bottom = h
		const c1 = hexToRgb(color)

		// Scan horizontally for left/right bounds
		for (let x = 0; x < w; x++) {
			let columnHasContent = false
			for (let y = 0; y < h; y++) {
				const i = (y * w + x) * 4
				const r = data[i] ?? 0
				const g = data[i + 1] ?? 0
				const b = data[i + 2] ?? 0
				const a = data[i + 3] ?? 1
				if (
					a &&
					Math.abs(c1.r - r) > tolerance &&
					Math.abs(c1.g - g) > tolerance &&
					Math.abs(c1.b - b) > tolerance
				) {
					columnHasContent = true
					break
				}
			}
			if (columnHasContent) {
				left = Math.min(left, x)
				right = Math.max(right, x)
			}
		}

		// Scan vertically for top/bottom bounds
		for (let y = 0; y < h; y++) {
			let rowHasContent = false
			for (let x = 0; x < w; x++) {
				const i = ((h - 1 - y) * w + x) * 4
				const r = data[i] ?? 0
				const g = data[i + 1] ?? 0
				const b = data[i + 2] ?? 0
				const a = data[i + 3] ?? 1
				if (
					a &&
					Math.abs(c1.r - r) > tolerance &&
					Math.abs(c1.g - g) > tolerance &&
					Math.abs(c1.b - b) > tolerance
				) {
					rowHasContent = true
					break
				}
			}
			if (rowHasContent) {
				top = Math.max(top, y)
				bottom = Math.min(bottom, y)
			}
		}

		if (left > right || top < bottom) {
			// page appears blank (or not detected), fallback to full page
			this.contentBounding.value = {
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				width: 0,
				height: 0,
			}
			return this.contentBounding.value
		}

		const boundLeft = Math.max(0, left - marginX)
		const boundRight = Math.min(this.pageBounding.value.right, right + marginX)
		const boundTop = Math.min(this.pageBounding.value.top, top + marginY)
		const boundBottom = Math.max(0, bottom - marginY)

		this.contentBounding.value = {
			left: boundLeft,
			right: boundRight,
			top: boundTop,
			bottom: boundBottom,
			width: Math.ceil(boundRight - boundLeft),
			height: Math.ceil(boundTop - boundBottom),
		}

		return this.contentBounding.value
	}

	private async initialize() {
		if (this.initialized.value) return
		this.lib = await import('pdfjs-dist')
		this.lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
		this.initialized.value = true
	}

	private getDocument(url: string) {
		return this.lib?.getDocument({
			url,
			wasmUrl: '/pdfjs/wasm/',
			cMapPacked: true,
			cMapUrl: '/pdfjs/cmaps/',
		})
	}

	private initializeDocument(pdf: PDFDocumentProxy) {
		this.document.value = pdf
	}

	public async getInfo() {
		const data = await this.document.value?.getMetadata()
		return data?.info as Record<string, unknown>
	}

	private loadDocument(url: string) {
		const loadingTask = this.getDocument(url)
		loadingTask?.promise.then(pdf => this.initializeDocument(pdf))
	}

	private load(url: string) {
		if (this.initialized.value) {
			this.loadDocument(url)
		} else {
			watch(
				this.initialized,
				value => {
					if (value) {
						this.loadDocument(url)
					}
				},
				{ once: true },
			)
		}
	}

	public get numPages() {
		return this.document.value?.numPages ?? 0
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
