import type { StitchImageMeta } from '~/stores/imageStitch'

export interface StitchImage extends StitchImageMeta {
	src: string // runtime blob URL — not persisted
}

export type AlignEdge =
	| 'top'
	| 'bottom'
	| 'left'
	| 'right'
	| 'center'
	| 'middle'

export type SelectAction =
	| { type: 'single'; id: string }   // plain click — replace selection
	| { type: 'toggle'; id: string }   // Ctrl/Meta — add/remove one unit
	| { type: 'range'; id: string }    // Shift — select from anchor to id

const MAX_HISTORY = 50

function metaOf(img: StitchImage): StitchImageMeta {
	const { src: _src, ...meta } = img
	return meta
}

export function useImageStitch() {
	const store = useImageStitchStore()
	const db = useImageStitchDB()
	const fileIO = useImageStitchFile()
	const { autoAlignHorizontal, autoAlignVertical } = useImageStitchAutoAlign()
	const { alignByThumbnail } = useImageStitchThumbAlign()

	// Runtime state — src is a blob URL created at load time
	const images = ref<StitchImage[]>([])
	const selectedIds = ref<string[]>([])
	const loading = ref(false)

	const canvasWidth = computed({
		get: () => store.canvasWidth,
		set: v => {
			store.canvasWidth = v
		},
	})
	const canvasHeight = computed({
		get: () => store.canvasHeight,
		set: v => {
			store.canvasHeight = v
		},
	})
	const canvasBg = computed({
		get: () => store.canvasBg,
		set: v => {
			store.canvasBg = v
		},
	})

	// ---- Helpers ----
	function getImageById(id: string): StitchImage | undefined {
		return images.value.find(i => i.id === id)
	}

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
			} else {
				console.warn('[image-stitch] Missing blob for image', meta.id, '— skipping')
			}
		}
		images.value = restored
		// Sync store in case some images were skipped
		syncMetas()
		pushHistory()
		loading.value = false
	}

	// ---- File input ----
	async function addFiles(files: File[] | FileList) {
		for (const file of files) {
			const id = crypto.randomUUID()
			const blob = file.slice(0, file.size, file.type) as Blob
			await db.saveBlob(id, blob)

			const src = URL.createObjectURL(blob)
			const imgEl = await loadImage(src)

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
		}
		if (files.length) pushHistory()
	}

	function cleanupObjectURLs() {
		for (const img of images.value) URL.revokeObjectURL(img.src)
	}

	// ---- Group helpers ----
	function groupMemberIds(id: string): string[] {
		const img = getImageById(id)
		if (!img?.groupId) return [id]
		return images.value.filter(i => i.groupId === img.groupId).map(i => i.id)
	}

	/**
	 * Represents a logical unit for alignment: either a single image or a group.
	 * `originX/Y` is the bounding-box top-left in canvas coordinates.
	 * `src` is a blob URL of the composited render (revoke after use).
	 */
	interface LogicalUnit {
		memberIds: string[]   // all image IDs in this unit
		src: string           // composite blob URL
		width: number
		height: number
		originX: number       // canvas x of the bounding box top-left
		originY: number       // canvas y of the bounding box top-left
	}

	async function compositeUnit(members: StitchImage[]): Promise<LogicalUnit> {
		const minX = Math.min(...members.map(i => i.x))
		const minY = Math.min(...members.map(i => i.y))
		const maxX = Math.max(...members.map(i => i.x + i.width))
		const maxY = Math.max(...members.map(i => i.y + i.height))
		const w = maxX - minX
		const h = maxY - minY

		const canvas = document.createElement('canvas')
		canvas.width = w
		canvas.height = h
		const ctx = canvas.getContext('2d')!
		const sorted = [...members].sort((a, b) => a.zIndex - b.zIndex)
		for (const img of sorted) {
			const el = await loadImage(img.src)
			ctx.drawImage(el, img.x - minX, img.y - minY, img.width, img.height)
		}
		const blob = await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png'),
		)
		return {
			memberIds: members.map(i => i.id),
			src: URL.createObjectURL(blob),
			width: w,
			height: h,
			originX: minX,
			originY: minY,
		}
	}

	/**
	 * Returns the distinct logical units (single images or full groups)
	 * that are currently selected.
	 */
	const selectedLogicalUnits = computed(() => {
		const seen = new Set<string>() // group IDs or image IDs already counted
		const units: { memberIds: string[]; representativeId: string }[] = []
		for (const id of selectedIds.value) {
			const img = getImageById(id)
			if (!img) continue
			const key = img.groupId ?? id
			if (seen.has(key)) continue
			seen.add(key)
			const memberIds = img.groupId
				? images.value.filter(i => i.groupId === img.groupId).map(i => i.id)
				: [id]
			units.push({ memberIds, representativeId: id })
		}
		return units
	})

	// ---- Selection ----
	// Last non-range click anchor (for Shift+click range selection)
	const selectionAnchorId = ref<string | null>(null)

	function selectImage(action: SelectAction) {
		const { id } = action
		const groupIds = groupMemberIds(id)

		if (action.type === 'toggle') {
			// Ctrl/Meta: add or remove this unit
			const allSelected = groupIds.every(gid => selectedIds.value.includes(gid))
			if (allSelected) {
				selectedIds.value = selectedIds.value.filter(s => !groupIds.includes(s))
			} else {
				const merged = new Set([...selectedIds.value, ...groupIds])
				selectedIds.value = [...merged]
			}
			selectionAnchorId.value = id
		} else if (action.type === 'range') {
			// Shift: select all layers between anchor and id (inclusive) in sorted order
			const anchor = selectionAnchorId.value ?? id
			const ids = sortedImages.value.map(i => i.id)
			const a = ids.indexOf(anchor)
			const b = ids.indexOf(id)
			const [lo, hi] = a <= b ? [a, b] : [b, a]
			const rangeIds = ids.slice(lo, hi + 1)
			// Expand each id in range to include its full group
			const expanded = new Set<string>()
			for (const rid of rangeIds) {
				for (const gid of groupMemberIds(rid)) expanded.add(gid)
			}
			selectedIds.value = [...expanded]
			// Do not update anchor on range selection
		} else {
			// Single: replace selection
			selectedIds.value = groupIds
			selectionAnchorId.value = id
		}
	}

	function deselectAll() {
		selectedIds.value = []
	}

	function selectAll() {
		selectedIds.value = images.value.map(i => i.id)
	}

	// ---- Nudge ----
	function nudge(dx: number, dy: number) {
		for (const selId of selectedIds.value) {
			const img = getImageById(selId)
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
		if (img) {
			img[axis] = value
			pushHistory()
		}
	}

	function setSize(dim: 'width' | 'height', value: number) {
		const img = singleSelected.value
		if (img) {
			img[dim] = Math.max(1, value)
			pushHistory()
		}
	}

	// ---- Layer order ----
	function moveLayer(id: string, delta: number) {
		const img = getImageById(id)
		if (!img) return
		const swap = images.value.find(i => i.zIndex === img.zIndex + delta)
		if (swap) swap.zIndex = img.zIndex
		img.zIndex += delta
		pushHistory()
	}

	function moveLayerToEdge(id: string, edge: 'top' | 'bottom') {
		const img = getImageById(id)
		if (!img) return
		if (edge === 'top') {
			const maxZ = Math.max(...images.value.map(i => i.zIndex))
			if (img.zIndex === maxZ) return
			images.value.forEach(i => {
				if (i.zIndex > img.zIndex) i.zIndex--
			})
			img.zIndex = maxZ
		} else {
			const minZ = Math.min(...images.value.map(i => i.zIndex))
			if (img.zIndex === minZ) return
			images.value.forEach(i => {
				if (i.zIndex < img.zIndex) i.zIndex++
			})
			img.zIndex = minZ
		}
		pushHistory()
	}

	function reorderLayers(orderedIds: string[]) {
		const total = orderedIds.length
		orderedIds.forEach((id, idx) => {
			const img = getImageById(id)
			if (img) img.zIndex = total - idx
		})
		pushHistory()
	}

	function renameImage(id: string, name: string) {
		const img = getImageById(id)
		if (img) {
			img.name = name.trim() || img.name
			pushHistory()
		}
	}

	function removeImage(id: string) {
		URL.revokeObjectURL(getImageById(id)?.src ?? '')
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
			case 'top': {
				const minY = Math.min(...selected.map(i => i.y))
				selected.forEach(i => {
					i.y = minY
				})
				break
			}
			case 'bottom': {
				const maxB = Math.max(...selected.map(i => i.y + i.height))
				selected.forEach(i => {
					i.y = maxB - i.height
				})
				break
			}
			case 'left': {
				const minX = Math.min(...selected.map(i => i.x))
				selected.forEach(i => {
					i.x = minX
				})
				break
			}
			case 'right': {
				const maxR = Math.max(...selected.map(i => i.x + i.width))
				selected.forEach(i => {
					i.x = maxR - i.width
				})
				break
			}
			case 'center': {
				const minX = Math.min(...selected.map(i => i.x))
				const maxR = Math.max(...selected.map(i => i.x + i.width))
				const cx = (minX + maxR) / 2
				selected.forEach(i => {
					i.x = Math.round(cx - i.width / 2)
				})
				break
			}
			case 'middle': {
				const minY = Math.min(...selected.map(i => i.y))
				const maxB = Math.max(...selected.map(i => i.y + i.height))
				const cy = (minY + maxB) / 2
				selected.forEach(i => {
					i.y = Math.round(cy - i.height / 2)
				})
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
		filename?: string
	}) {
		const canvas = document.createElement('canvas')
		canvas.width = opts.width
		canvas.height = opts.height
		const ctx = canvas.getContext('2d')
		if (!ctx) throw new Error('Failed to create canvas context')
		const scaleX = opts.width / store.canvasWidth
		const scaleY = opts.height / store.canvasHeight
		ctx.fillStyle = store.canvasBg
		ctx.fillRect(0, 0, canvas.width, canvas.height)
		for (const img of sortedImages.value) {
			const el = await loadImage(img.src).catch(() => null)
			if (el)
				ctx.drawImage(
					el,
					Math.round(img.x * scaleX),
					Math.round(img.y * scaleY),
					Math.round(img.width * scaleX),
					Math.round(img.height * scaleY),
				)
		}
		const quality = opts.format === 'image/png' ? undefined : opts.quality / 100
		const ext =
			opts.format === 'image/png'
				? 'png'
				: opts.format === 'image/jpeg'
					? 'jpg'
					: 'webp'
		const a = document.createElement('a')
		a.href = canvas.toDataURL(opts.format, quality)
		a.download = `${opts.filename || 'stitched-image'}.${ext}`
		a.click()
	}

	// ---- Project file save / open ----
	async function saveProject(): Promise<void> {
		await fileIO.saveFile(
			images.value.map(metaOf),
			store.canvasWidth,
			store.canvasHeight,
			store.canvasBg,
		)
	}

	type LoadedProject = Awaited<ReturnType<typeof fileIO.openFile>>

	async function applyProject(project: LoadedProject): Promise<void> {
		cleanupObjectURLs()
		await db.clearAll()
		store.imageMetas = []

		const loaded: StitchImage[] = []
		for (const img of project.images) {
			await db.saveBlob(img.id, img.blob)
			loaded.push({ ...img, src: URL.createObjectURL(img.blob) })
		}
		images.value = loaded
		store.canvasWidth = project.canvasWidth
		store.canvasHeight = project.canvasHeight
		store.canvasBg = project.canvasBg
		selectedIds.value = []
		history.value = []
		historyIndex.value = -1
		pushHistory()
	}

	async function loadProject(file: File): Promise<void> {
		const project = await fileIO.openFile(file)
		await applyProject(project)
	}

	async function pickAndLoadProject(): Promise<void> {
		const project = await fileIO.pickAndOpen()
		if (project) await applyProject(project)
	}

	// ---- Auto align (two selected logical units) ----
	// A logical unit is either a single image or a group (composited into one canvas).
	// Detects whether to align horizontally or vertically based on bounding-box positions.
	async function autoAlignSelected(): Promise<{
		overlap: number
		confidence: number
	} | null> {
		const units = selectedLogicalUnits.value
		if (units.length !== 2) return null

		// Build composite for each unit
		const getMembers = (memberIds: string[]) =>
			memberIds.map(id => getImageById(id)).filter(Boolean) as StitchImage[]

		const [compA, compB] = await Promise.all([
			compositeUnit(getMembers(units[0]!.memberIds)),
			compositeUnit(getMembers(units[1]!.memberIds)),
		])

		try {
			const sameWidth = compA.width === compB.width
			const sameHeight = compA.height === compB.height

			const centerAx = compA.originX + compA.width / 2
			const centerBx = compB.originX + compB.width / 2
			const centerAy = compA.originY + compA.height / 2
			const centerBy = compB.originY + compB.height / 2
			const diffX = Math.abs(centerAx - centerBx)
			const diffY = Math.abs(centerAy - centerBy)

			const useVertical =
				sameWidth && !sameHeight
					? true
					: sameHeight && !sameWidth
						? false
						: diffY >= diffX

			if (useVertical) {
				const w = Math.min(compA.width, compB.width)
				let hint: 'a-top' | 'b-top' | undefined
				if (diffY > 10) hint = centerAy < centerBy ? 'a-top' : 'b-top'

				const result = await autoAlignVertical(
					compA.src, compA.height,
					compB.src, compB.height,
					w, hint,
				)
				if (!result) return null

				const topComp = result.topImage === 'a' ? compA : compB
				const botComp = result.topImage === 'a' ? compB : compA
				const botIds = result.topImage === 'a' ? units[1]!.memberIds : units[0]!.memberIds

				// New origin for the bottom unit
				const newBotOriginY = topComp.originY + topComp.height - result.overlap
				const dy = newBotOriginY - botComp.originY
				const dx = topComp.originX - botComp.originX
				for (const id of botIds) {
					const img = getImageById(id)
					if (img) { img.x += dx; img.y += dy }
				}

				pushHistory()
				return { overlap: result.overlap, confidence: result.confidence }
			} else {
				const h = Math.min(compA.height, compB.height)
				let hint: 'a-left' | 'b-left' | undefined
				if (diffX > 10) hint = centerAx < centerBx ? 'a-left' : 'b-left'

				const result = await autoAlignHorizontal(
					compA.src, compA.width,
					compB.src, compB.width,
					h, hint,
				)
				if (!result) return null

				const leftComp = result.leftImage === 'a' ? compA : compB
				const rightComp = result.leftImage === 'a' ? compB : compA
				const rightIds = result.leftImage === 'a' ? units[1]!.memberIds : units[0]!.memberIds

				// New origin for the right unit
				const newRightOriginX = leftComp.originX + leftComp.width - result.overlap
				const dx = newRightOriginX - rightComp.originX
				const dy = leftComp.originY - rightComp.originY
				for (const id of rightIds) {
					const img = getImageById(id)
					if (img) { img.x += dx; img.y += dy }
				}

				pushHistory()
				return { overlap: result.overlap, confidence: result.confidence }
			}
		} finally {
			URL.revokeObjectURL(compA.src)
			URL.revokeObjectURL(compB.src)
		}
	}

	// ---- Auto layer order ----
	// Sort selected images by position in a given direction; higher score → higher z-index.
	function autoLayerOrder(
		direction: 'top-left' | 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left',
	) {
		const selected = images.value.filter(i => selectedIds.value.includes(i.id))
		if (selected.length < 2) return

		const score = (img: StitchImage) => {
			const cx = img.x + img.width / 2
			const cy = img.y + img.height / 2
			switch (direction) {
				case 'top-left':     return -(cx + cy)
				case 'top':          return -cy
				case 'top-right':    return cx - cy
				case 'right':        return cx
				case 'bottom-right': return cx + cy
				case 'bottom':       return cy
				case 'bottom-left':  return cy - cx
				case 'left':         return -cx
			}
		}

		// Sort ascending by score; assign z-indices from the existing set so non-selected layers aren't affected
		const sorted = [...selected].sort((a, b) => score(a) - score(b))
		const zValues = selected.map(i => i.zIndex).sort((a, b) => a - b)
		sorted.forEach((img, idx) => { img.zIndex = zValues[idx]! })
		pushHistory()
	}

	// ---- Grouping ----
	function groupSelected() {
		if (selectedIds.value.length < 2) return
		const newGroupId = crypto.randomUUID()
		for (const id of selectedIds.value) {
			const img = getImageById(id)
			if (img) img.groupId = newGroupId
		}
		pushHistory()
	}

	function ungroupSelected() {
		const affected = new Set<string>()
		for (const id of selectedIds.value) {
			const img = getImageById(id)
			if (img?.groupId) affected.add(img.groupId)
		}
		if (affected.size === 0) return
		for (const img of images.value) {
			if (img.groupId && affected.has(img.groupId)) {
				img.groupId = undefined
			}
		}
		pushHistory()
	}

	const selectedHaveGroup = computed(() =>
		selectedIds.value.some(id => getImageById(id)?.groupId),
	)

	// ---- Crop canvas to content ----
	function cropToContent() {
		if (images.value.length === 0) return
		const minX = Math.min(...images.value.map(i => i.x))
		const minY = Math.min(...images.value.map(i => i.y))
		const maxX = Math.max(...images.value.map(i => i.x + i.width))
		const maxY = Math.max(...images.value.map(i => i.y + i.height))
		// Shift all images so the bounding box starts at (0, 0)
		for (const img of images.value) {
			img.x -= minX
			img.y -= minY
		}
		store.canvasWidth = maxX - minX
		store.canvasHeight = maxY - minY
		pushHistory()
	}

	// ---- Thumbnail-guided layout ----
	// One image is the thumbnail; the rest are patches to be positioned.
	// Phase 1: thumbnail SSD → snaps each patch to its grid cell.
	// Phase 2: auto-align adjacent pairs → pixel-perfect overlap seams.
	async function alignByThumbnailSelected(thumbId: string): Promise<{ avgConfidence: number } | null> {
		const patches = images.value.filter(i => i.id !== thumbId)
		const thumb = getImageById(thumbId)
		if (!thumb || patches.length === 0) return null

		const cols = Math.round(Math.sqrt(patches.length))
		const rows = Math.ceil(patches.length / cols)
		const result = await alignByThumbnail(
			thumb.src,
			thumb.width,
			thumb.height,
			patches.map(p => ({ id: p.id, src: p.src })),
			cols,
			rows,
		)

		// Apply initial grid placements
		for (const placement of result.placements) {
			const img = getImageById(placement.id)
			if (img) { img.x = placement.x; img.y = placement.y }
		}
		store.canvasWidth = result.canvasWidth
		store.canvasHeight = result.canvasHeight

		// Phase 2: refine each adjacent pair with pixel-level auto-align.
		// Build a col×row grid from placements (sorted by x then y).
		const sorted = [...result.placements].sort((a, b) =>
			a.x !== b.x ? a.x - b.x : a.y - b.y,
		)
		// Map (col, row) → image
		const grid: (StitchImage | undefined)[][] = Array.from({ length: cols }, () =>
			Array(rows).fill(undefined),
		)
		for (const p of sorted) {
			const col = Math.round(p.x / thumb.width)
			const row = Math.round(p.y / thumb.height)
			const img = getImageById(p.id)
			if (img && col < cols && row < rows) grid[col]![row] = img
		}

		// Refine horizontal pairs: rows are independent → run all rows in parallel.
		// Within each row, pairs must be sequential (right depends on left's final x).
		await Promise.all(
			Array.from({ length: rows }, (_, row) => async () => {
				for (let col = 0; col < cols - 1; col++) {
					const left = grid[col]![row]
					const right = grid[col + 1]![row]
					if (!left || !right) continue
					const h = Math.min(left.height, right.height)
					const res = await autoAlignHorizontal(left.src, left.width, right.src, right.width, h, 'a-left')
					if (res) {
						right.x = left.x + left.width - res.overlap
						right.y = left.y
					}
				}
			}).map(fn => fn()),
		)

		// Refine vertical pairs: cols are independent → run all cols in parallel.
		// Within each col, pairs must be sequential (bot depends on top's final y).
		await Promise.all(
			Array.from({ length: cols }, (_, col) => async () => {
				for (let row = 0; row < rows - 1; row++) {
					const top = grid[col]![row]
					const bot = grid[col]![row + 1]
					if (!top || !bot) continue
					const w = Math.min(top.width, bot.width)
					const res = await autoAlignVertical(top.src, top.height, bot.src, bot.height, w, 'a-top')
					if (res) {
						bot.y = top.y + top.height - res.overlap
						bot.x = top.x
					}
				}
			}).map(fn => fn()),
		)

		pushHistory()
		return { avgConfidence: result.avgConfidence }
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
		selectAll,
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
		saveProject,
		loadProject,
		pickAndLoadProject,
		autoAlignSelected,
		cropToContent,
		alignByThumbnailSelected,
		autoLayerOrder,
		renameImage,
		groupMemberIds,
		groupSelected,
		ungroupSelected,
		selectedHaveGroup,
		selectedLogicalUnits,
	}
}
