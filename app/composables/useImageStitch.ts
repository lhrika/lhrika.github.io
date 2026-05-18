export interface StitchImage {
	id: string
	name: string
	src: string
	x: number
	y: number
	width: number
	height: number
	zIndex: number
}

export type AlignEdge = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'middle'

const MAX_HISTORY = 50

export function useImageStitch() {
	const images = ref<StitchImage[]>([])
	const selectedIds = ref<string[]>([])
	const canvasWidth = ref(1200)
	const canvasHeight = ref(800)
	const canvasBg = ref('#ffffff')

	// ---- Derived ----
	const sortedImages = computed(() =>
		[...images.value].sort((a, b) => a.zIndex - b.zIndex),
	)

	const singleSelected = computed(() =>
		selectedIds.value.length === 1
			? images.value.find(i => i.id === selectedIds.value[0])
			: undefined,
	)

	// ---- History ----
	const history = ref<StitchImage[][]>([])
	const historyIndex = ref(-1)

	function snapshotImages(): StitchImage[] {
		return images.value.map(i => ({ ...i }))
	}

	function pushHistory() {
		history.value = history.value.slice(0, historyIndex.value + 1)
		history.value.push(snapshotImages())
		if (history.value.length > MAX_HISTORY) history.value.shift()
		historyIndex.value = history.value.length - 1
	}

	function undo() {
		if (historyIndex.value <= 0) return
		historyIndex.value--
		images.value = history.value[historyIndex.value].map(i => ({ ...i }))
	}

	function redo() {
		if (historyIndex.value >= history.value.length - 1) return
		historyIndex.value++
		images.value = history.value[historyIndex.value].map(i => ({ ...i }))
	}

	const canUndo = computed(() => historyIndex.value > 0)
	const canRedo = computed(() => historyIndex.value < history.value.length - 1)

	// ---- File input ----
	function addFiles(files: FileList) {
		for (const file of files) {
			const src = URL.createObjectURL(file)
			const imgEl = new Image()
			imgEl.onload = () => {
				const id = crypto.randomUUID()
				const maxZ = images.value.reduce((m, i) => Math.max(m, i.zIndex), 0)
				images.value.push({
					id,
					name: file.name,
					src,
					x: 0,
					y: 0,
					width: imgEl.naturalWidth,
					height: imgEl.naturalHeight,
					zIndex: maxZ + 1,
				})
				pushHistory()
			}
			imgEl.src = src
		}
	}

	function cleanupObjectURLs() {
		for (const img of images.value) {
			URL.revokeObjectURL(img.src)
		}
	}

	// ---- Selection ----
	function selectImage(e: MouseEvent, id: string) {
		if (e.shiftKey || e.ctrlKey || e.metaKey) {
			if (selectedIds.value.includes(id)) {
				selectedIds.value = selectedIds.value.filter(s => s !== id)
			} else {
				selectedIds.value = [...selectedIds.value, id]
			}
		} else {
			selectedIds.value = [id]
		}
	}

	function deselectAll() {
		selectedIds.value = []
	}

	// ---- Nudge ----
	function nudge(dx: number, dy: number) {
		for (const selId of selectedIds.value) {
			const img = images.value.find(i => i.id === selId)
			if (img) {
				img.x += dx
				img.y += dy
			}
		}
		pushHistory()
	}

	// ---- Direct position / size input ----
	function setPos(axis: 'x' | 'y', value: number) {
		const img = singleSelected.value
		if (img) { img[axis] = value; pushHistory() }
	}

	function setSize(dim: 'width' | 'height', value: number) {
		const img = singleSelected.value
		if (img) { img[dim] = Math.max(1, value); pushHistory() }
	}

	// ---- Layer order ----
	function moveLayer(id: string, delta: number) {
		const img = images.value.find(i => i.id === id)
		if (!img) return
		const targetZ = img.zIndex + delta
		const swapImg = images.value.find(i => i.zIndex === targetZ)
		if (swapImg) swapImg.zIndex = img.zIndex
		img.zIndex = targetZ
		pushHistory()
	}

	function moveLayerToEdge(id: string, edge: 'top' | 'bottom') {
		const img = images.value.find(i => i.id === id)
		if (!img) return
		if (edge === 'top') {
			const maxZ = Math.max(...images.value.map(i => i.zIndex))
			if (img.zIndex === maxZ) return
			images.value.forEach(i => { if (i.zIndex > img.zIndex) i.zIndex-- })
			img.zIndex = maxZ
		} else {
			const minZ = Math.min(...images.value.map(i => i.zIndex))
			if (img.zIndex === minZ) return
			images.value.forEach(i => { if (i.zIndex < img.zIndex) i.zIndex++ })
			img.zIndex = minZ
		}
		pushHistory()
	}

	function reorderLayers(orderedIds: string[]) {
		const total = orderedIds.length
		orderedIds.forEach((id, idx) => {
			const img = images.value.find(i => i.id === id)
			if (img) img.zIndex = total - idx
		})
		pushHistory()
	}

	function removeImage(id: string) {
		images.value = images.value.filter(i => i.id !== id)
		selectedIds.value = selectedIds.value.filter(s => s !== id)
		pushHistory()
	}

	// ---- Alignment ----
	function alignImages(edge: AlignEdge) {
		const selected = images.value.filter(i => selectedIds.value.includes(i.id))
		if (selected.length < 2) return

		switch (edge) {
			case 'top': {
				const minY = Math.min(...selected.map(i => i.y))
				selected.forEach(i => { i.y = minY })
				break
			}
			case 'bottom': {
				const maxBottom = Math.max(...selected.map(i => i.y + i.height))
				selected.forEach(i => { i.y = maxBottom - i.height })
				break
			}
			case 'left': {
				const minX = Math.min(...selected.map(i => i.x))
				selected.forEach(i => { i.x = minX })
				break
			}
			case 'right': {
				const maxRight = Math.max(...selected.map(i => i.x + i.width))
				selected.forEach(i => { i.x = maxRight - i.width })
				break
			}
			case 'center': {
				const minX = Math.min(...selected.map(i => i.x))
				const maxRight = Math.max(...selected.map(i => i.x + i.width))
				const cx = (minX + maxRight) / 2
				selected.forEach(i => { i.x = Math.round(cx - i.width / 2) })
				break
			}
			case 'middle': {
				const minY = Math.min(...selected.map(i => i.y))
				const maxBottom = Math.max(...selected.map(i => i.y + i.height))
				const cy = (minY + maxBottom) / 2
				selected.forEach(i => { i.y = Math.round(cy - i.height / 2) })
				break
			}
		}
		pushHistory()
	}

	// ---- Export ----
	async function exportImage(opts: {
		format: string
		width: number
		height: number
		quality: number
	}) {
		const canvas = document.createElement('canvas')
		const scaleX = opts.width / canvasWidth.value
		const scaleY = opts.height / canvasHeight.value
		canvas.width = opts.width
		canvas.height = opts.height
		const ctx = canvas.getContext('2d')
		if (!ctx) return

		ctx.fillStyle = canvasBg.value
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		for (const img of sortedImages.value) {
			await new Promise<void>(resolve => {
				const imgEl = new Image()
				imgEl.onload = () => {
					ctx.drawImage(
						imgEl,
						Math.round(img.x * scaleX),
						Math.round(img.y * scaleY),
						Math.round(img.width * scaleX),
						Math.round(img.height * scaleY),
					)
					resolve()
				}
				imgEl.onerror = () => resolve()
				imgEl.src = img.src
			})
		}

		const quality = opts.format === 'image/png' ? undefined : opts.quality / 100
		const dataUrl = canvas.toDataURL(opts.format, quality)
		const ext = opts.format === 'image/png' ? 'png' : opts.format === 'image/jpeg' ? 'jpg' : 'webp'

		const a = document.createElement('a')
		a.href = dataUrl
		a.download = `stitched-image.${ext}`
		a.click()
	}

	// Init history
	pushHistory()

	return {
		images,
		selectedIds,
		canvasWidth,
		canvasHeight,
		canvasBg,
		sortedImages,
		singleSelected,
		canUndo,
		canRedo,
		undo,
		redo,
		addFiles,
		cleanupObjectURLs,
		selectImage,
		deselectAll,
		nudge,
		setPos,
		setSize,
		moveLayer,
		moveLayerToEdge,
		reorderLayers,
		removeImage,
		alignImages,
		exportImage,
		pushHistory,
	}
}
