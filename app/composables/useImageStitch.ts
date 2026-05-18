import type { StitchImageMeta } from '~/stores/imageStitch'

export interface StitchImage extends StitchImageMeta {
	src: string  // runtime blob URL — not persisted
}

export type AlignEdge = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'middle'

const MAX_HISTORY = 50

function metaOf(img: StitchImage): StitchImageMeta {
	const { src: _src, ...meta } = img
	return meta
}

export function useImageStitch() {
	const store = useImageStitchStore()
	const db = useImageStitchDB()

	// Runtime state — src is a blob URL created at load time
	const images = ref<StitchImage[]>([])
	const selectedIds = ref<string[]>([])
	const loading = ref(false)

	const canvasWidth = computed({
		get: () => store.canvasWidth,
		set: v => { store.canvasWidth = v },
	})
	const canvasHeight = computed({
		get: () => store.canvasHeight,
		set: v => { store.canvasHeight = v },
	})
	const canvasBg = computed({
		get: () => store.canvasBg,
		set: v => { store.canvasBg = v },
	})

	// ---- Derived ----
	const sortedImages = computed(() =>
		[...images.value].sort((a, b) => a.zIndex - b.zIndex),
	)

	const singleSelected = computed(() =>
		selectedIds.value.length === 1
			? images.value.find(i => i.id === selectedIds.value[0])
			: undefined,
	)

	// ---- Sync metadata to store ----
	function syncMetas() {
		store.imageMetas = images.value.map(metaOf)
	}

	// ---- History ----
	// History stores only metadata snapshots (no blob data)
	const history = ref<StitchImageMeta[][]>([])
	const historyIndex = ref(-1)

	function snapshotMetas(): StitchImageMeta[] {
		return images.value.map(metaOf)
	}

	function pushHistory() {
		history.value = history.value.slice(0, historyIndex.value + 1)
		history.value.push(snapshotMetas())
		if (history.value.length > MAX_HISTORY) history.value.shift()
		historyIndex.value = history.value.length - 1
		syncMetas()
	}

	function applySnapshot(metas: StitchImageMeta[]) {
		// Merge metas back with existing blob URLs
		images.value = metas.map(meta => {
			const existing = images.value.find(i => i.id === meta.id)
			return { ...meta, src: existing?.src ?? '' }
		})
		syncMetas()
	}

	function undo() {
		if (historyIndex.value <= 0) return
		historyIndex.value--
		const snapshot = history.value[historyIndex.value]
		if (snapshot) applySnapshot(snapshot)
	}

	function redo() {
		if (historyIndex.value >= history.value.length - 1) return
		historyIndex.value++
		const snapshot = history.value[historyIndex.value]
		if (snapshot) applySnapshot(snapshot)
	}

	const canUndo = computed(() => historyIndex.value > 0)
	const canRedo = computed(() => historyIndex.value < history.value.length - 1)

	// ---- Restore from persisted state ----
	async function restore() {
		if (store.imageMetas.length === 0) {
			pushHistory()
			return
		}
		loading.value = true
		const restored: StitchImage[] = []
		for (const meta of store.imageMetas) {
			const blob = await db.loadBlob(meta.id)
			if (blob) {
				restored.push({ ...meta, src: URL.createObjectURL(blob) })
			}
			// If blob is missing (e.g. cleared by browser), skip the image
		}
		images.value = restored
		// Sync store in case some images were skipped
		syncMetas()
		pushHistory()
		loading.value = false
	}

	// ---- File input ----
	async function addFiles(files: FileList) {
		for (const file of files) {
			const id = crypto.randomUUID()
			const blob = file.slice(0, file.size, file.type) as Blob
			await db.saveBlob(id, blob)

			const src = URL.createObjectURL(blob)
			const imgEl = new Image()
			await new Promise<void>(resolve => { imgEl.onload = () => resolve(); imgEl.src = src })

			const maxZ = images.value.reduce((m, i) => Math.max(m, i.zIndex), 0)
			images.value.push({ id, name: file.name, src, x: 0, y: 0, width: imgEl.naturalWidth, height: imgEl.naturalHeight, zIndex: maxZ + 1 })
			pushHistory()
		}
	}

	function cleanupObjectURLs() {
		for (const img of images.value) URL.revokeObjectURL(img.src)
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

	function deselectAll() { selectedIds.value = [] }

	// ---- Nudge ----
	function nudge(dx: number, dy: number) {
		for (const selId of selectedIds.value) {
			const img = images.value.find(i => i.id === selId)
			if (img) { img.x += dx; img.y += dy }
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
		const swap = images.value.find(i => i.zIndex === img.zIndex + delta)
		if (swap) swap.zIndex = img.zIndex
		img.zIndex += delta
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
		URL.revokeObjectURL(images.value.find(i => i.id === id)?.src ?? '')
		images.value = images.value.filter(i => i.id !== id)
		selectedIds.value = selectedIds.value.filter(s => s !== id)
		db.deleteBlobs([id])
		pushHistory()
	}

	// ---- Alignment ----
	function alignImages(edge: AlignEdge) {
		const selected = images.value.filter(i => selectedIds.value.includes(i.id))
		if (selected.length < 2) return
		switch (edge) {
			case 'top': { const minY = Math.min(...selected.map(i => i.y)); selected.forEach(i => { i.y = minY }); break }
			case 'bottom': { const maxB = Math.max(...selected.map(i => i.y + i.height)); selected.forEach(i => { i.y = maxB - i.height }); break }
			case 'left': { const minX = Math.min(...selected.map(i => i.x)); selected.forEach(i => { i.x = minX }); break }
			case 'right': { const maxR = Math.max(...selected.map(i => i.x + i.width)); selected.forEach(i => { i.x = maxR - i.width }); break }
			case 'center': {
				const minX = Math.min(...selected.map(i => i.x))
				const maxR = Math.max(...selected.map(i => i.x + i.width))
				const cx = (minX + maxR) / 2
				selected.forEach(i => { i.x = Math.round(cx - i.width / 2) })
				break
			}
			case 'middle': {
				const minY = Math.min(...selected.map(i => i.y))
				const maxB = Math.max(...selected.map(i => i.y + i.height))
				const cy = (minY + maxB) / 2
				selected.forEach(i => { i.y = Math.round(cy - i.height / 2) })
				break
			}
		}
		pushHistory()
	}

	// ---- Export ----
	async function exportImage(opts: { format: string; width: number; height: number; quality: number }) {
		const canvas = document.createElement('canvas')
		canvas.width = opts.width
		canvas.height = opts.height
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		const scaleX = opts.width / store.canvasWidth
		const scaleY = opts.height / store.canvasHeight
		ctx.fillStyle = store.canvasBg
		ctx.fillRect(0, 0, canvas.width, canvas.height)
		for (const img of sortedImages.value) {
			await new Promise<void>(resolve => {
				const el = new Image()
				el.onload = () => { ctx.drawImage(el, Math.round(img.x * scaleX), Math.round(img.y * scaleY), Math.round(img.width * scaleX), Math.round(img.height * scaleY)); resolve() }
				el.onerror = () => resolve()
				el.src = img.src
			})
		}
		const quality = opts.format === 'image/png' ? undefined : opts.quality / 100
		const ext = opts.format === 'image/png' ? 'png' : opts.format === 'image/jpeg' ? 'jpg' : 'webp'
		const a = document.createElement('a')
		a.href = canvas.toDataURL(opts.format, quality)
		a.download = `stitched-image.${ext}`
		a.click()
	}

	// ---- Clear all ----
	async function clearAll() {
		cleanupObjectURLs()
		images.value = []
		selectedIds.value = []
		history.value = []
		historyIndex.value = -1
		store.imageMetas = []
		await db.clearAll()
		pushHistory()
	}

	return {
		images,
		selectedIds,
		loading,
		canvasWidth,
		canvasHeight,
		canvasBg,
		sortedImages,
		singleSelected,
		canUndo,
		canRedo,
		restore,
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
		clearAll,
	}
}
