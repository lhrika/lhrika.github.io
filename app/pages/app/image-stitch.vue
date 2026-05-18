<template>
	<UPage>
		<UPageHeader
			title="图片拼接"
			description="将多张图片拼接成一张大图，支持自由移动、层次控制、对齐和导出"
		/>
		<UPageBody>
			<UContainer class="space-y-4">
				<!-- Toolbar -->
				<div class="flex flex-wrap gap-2 items-center">
					<!-- Add images -->
					<UButton
						icon="i-lucide-image-plus"
						label="添加图片"
						@click="triggerFileInput"
					/>
					<input
						ref="fileInputRef"
						type="file"
						accept="image/*"
						multiple
						class="hidden"
						@change="onFilesSelected"
					/>

					<!-- Canvas size -->
					<div class="flex items-center gap-1">
						<UInput
							v-model.number="canvasWidth"
							type="number"
							min="100"
							max="10000"
							class="w-24"
							placeholder="宽"
						/>
						<span class="text-muted text-sm">×</span>
						<UInput
							v-model.number="canvasHeight"
							type="number"
							min="100"
							max="10000"
							class="w-24"
							placeholder="高"
						/>
						<span class="text-muted text-sm">px</span>
					</div>

					<!-- Zoom -->
					<div class="flex items-center gap-1">
						<UButton
							icon="i-lucide-zoom-out"
							color="neutral"
							variant="subtle"
							:disabled="zoom <= 0.1"
							@click="zoom = Math.max(0.1, +(zoom - 0.1).toFixed(1))"
						/>
						<span class="text-sm w-12 text-center">{{ Math.round(zoom * 100) }}%</span>
						<UButton
							icon="i-lucide-zoom-in"
							color="neutral"
							variant="subtle"
							:disabled="zoom >= 4"
							@click="zoom = Math.min(4, +(zoom + 0.1).toFixed(1))"
						/>
					</div>

					<!-- Undo / Redo -->
					<UButton
						icon="i-lucide-undo-2"
						color="neutral"
						variant="subtle"
						title="撤销 (Ctrl+Z)"
						:disabled="historyIndex <= 0"
						@click="undo"
					/>
					<UButton
						icon="i-lucide-redo-2"
						color="neutral"
						variant="subtle"
						title="重做 (Ctrl+Shift+Z)"
						:disabled="historyIndex >= history.length - 1"
						@click="redo"
					/>

					<div class="flex-1" />

					<!-- Alignment (only when ≥2 selected) -->
					<template v-if="selectedIds.length >= 2">
						<span class="text-sm text-muted">对齐:</span>
						<UButton
							icon="i-lucide-align-start-horizontal"
							color="neutral"
							variant="subtle"
							title="顶部对齐"
							@click="alignImages('top')"
						/>
						<UButton
							icon="i-lucide-align-center-horizontal"
							color="neutral"
							variant="subtle"
							title="垂直居中对齐"
							@click="alignImages('middle')"
						/>
						<UButton
							icon="i-lucide-align-end-horizontal"
							color="neutral"
							variant="subtle"
							title="底部对齐"
							@click="alignImages('bottom')"
						/>
						<UButton
							icon="i-lucide-align-start-vertical"
							color="neutral"
							variant="subtle"
							title="左侧对齐"
							@click="alignImages('left')"
						/>
						<UButton
							icon="i-lucide-align-center-vertical"
							color="neutral"
							variant="subtle"
							title="水平居中对齐"
							@click="alignImages('center')"
						/>
						<UButton
							icon="i-lucide-align-end-vertical"
							color="neutral"
							variant="subtle"
							title="右侧对齐"
							@click="alignImages('right')"
						/>
					</template>

					<!-- Export -->
					<UButton
						icon="i-lucide-download"
						label="导出"
						color="primary"
						variant="outline"
						:disabled="images.length === 0"
						@click="showExportPanel = !showExportPanel"
					/>
				</div>

				<!-- Export panel -->
				<div
					v-if="showExportPanel"
					class="border border-muted rounded-lg p-4 space-y-3 bg-elevated"
				>
					<div class="font-medium text-sm">导出选项</div>
					<div class="flex flex-wrap gap-4 items-end">
						<UFormField label="格式">
							<USelect v-model="exportFormat" :items="formatOptions" class="w-28" />
						</UFormField>
						<UFormField label="宽度 (px)">
							<UInput
								v-model.number="exportWidth"
								type="number"
								min="1"
								max="20000"
								class="w-28"
							/>
						</UFormField>
						<UFormField label="高度 (px)">
							<UInput
								v-model.number="exportHeight"
								type="number"
								min="1"
								max="20000"
								class="w-28"
							/>
						</UFormField>
						<UFormField
							v-if="exportFormat !== 'image/png'"
							label="质量 (1-100)"
						>
							<UInput
								v-model.number="exportQuality"
								type="number"
								min="1"
								max="100"
								class="w-28"
							/>
						</UFormField>
						<UButton label="导出图片" icon="i-lucide-download" @click="exportImage" />
					</div>
				</div>

				<!-- Main area: canvas + layer panel -->
				<div class="flex gap-4">
					<!-- Canvas area -->
					<div
						ref="canvasContainerRef"
						class="relative overflow-hidden border border-muted rounded-lg bg-[#e5e7eb] flex-1 min-h-100"
						style="max-height: 70vh; cursor: crosshair"
						:style="{ cursor: spaceDown ? (isPanning ? 'grabbing' : 'grab') : undefined }"
						@mousedown="onContainerMouseDown"
					>
						<div
							:style="{
								width: canvasWidth * zoom + 'px',
								height: canvasHeight * zoom + 'px',
								position: 'absolute',
								left: '50%',
								top: '50%',
								transform: `translate(calc(-50% + ${panOffset.x}px), calc(-50% + ${panOffset.y}px))`,
								background: canvasBg,
								overflow: 'hidden',
								flexShrink: 0,
								boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
							}"
							@mousedown.self="deselectAll"
						>
							<!-- Images rendered in z-order -->
							<div
								v-for="img in sortedImages"
								:key="img.id"
								:style="{
									position: 'absolute',
									left: img.x * zoom + 'px',
									top: img.y * zoom + 'px',
									width: img.width * zoom + 'px',
									height: img.height * zoom + 'px',
									zIndex: img.zIndex,
									cursor: dragging?.id === img.id ? 'grabbing' : 'grab',
									outline: selectedIds.includes(img.id)
										? '2px solid #6366f1'
										: '2px solid transparent',
									boxSizing: 'border-box',
									userSelect: 'none',
								}"
								@mousedown.stop="startDrag($event, img.id)"
								@click.stop="selectImage($event, img.id)"
							>
								<img
									:src="img.src"
									:style="{
										width: '100%',
										height: '100%',
										display: 'block',
										pointerEvents: 'none',
										userSelect: 'none',
									}"
									draggable="false"
								/>
								<!-- Resize handle -->
								<div
									class="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 opacity-80 cursor-se-resize"
									@mousedown.stop="startResize($event, img.id)"
								/>
							</div>
						</div>
					</div>

					<!-- Layer panel -->
					<div
						v-if="images.length > 0"
						class="w-48 border border-muted rounded-lg bg-elevated flex flex-col"
					>
						<div class="px-3 py-2 text-sm font-medium border-b border-muted">
							图层 ({{ images.length }})
						</div>
						<div class="flex-1 overflow-y-auto" @dragover.prevent @drop.prevent="onLayerDrop($event, null)">
							<!-- Highest z first in list -->
							<div
								v-for="img in [...sortedImages].reverse()"
								:key="img.id"
								draggable="true"
								class="flex items-center gap-1 px-2 py-1.5 text-xs cursor-grab hover:bg-muted/50 transition-colors border-t-2 border-transparent"
								:class="{
									'bg-primary/10': selectedIds.includes(img.id),
									'border-t-primary!': layerDragOver === img.id && layerDragPos === 'before',
									'border-b-primary! border-b-2': layerDragOver === img.id && layerDragPos === 'after',
									'opacity-40': layerDragging === img.id,
								}"
								@click.stop="selectImage($event, img.id)"
								@dragstart="onLayerDragStart($event, img.id)"
								@dragend="onLayerDragEnd"
								@dragover.prevent="onLayerDragOver($event, img.id)"
								@dragleave="onLayerDragLeave(img.id)"
								@drop.prevent.stop="onLayerDrop($event, img.id)"
							>
								<Icon name="i-lucide-grip-vertical" class="size-3 text-muted shrink-0" />
								<img
									:src="img.src"
									class="w-7 h-7 object-cover rounded shrink-0"
								/>
								<span class="flex-1 truncate text-muted">{{ img.name }}</span>
							</div>
						</div>
						<!-- Layer action buttons -->
						<div class="px-2 py-1.5 border-t border-muted flex gap-1 justify-center">
							<UButton
								icon="i-lucide-chevron-up"
								size="xs"
								color="neutral"
								variant="subtle"
								title="上移一层"
								:disabled="!singleSelected || singleSelected.zIndex >= images.length"
								@click="singleSelected && moveLayer(singleSelected.id, 1)"
							/>
							<UButton
								icon="i-lucide-chevron-down"
								size="xs"
								color="neutral"
								variant="subtle"
								title="下移一层"
								:disabled="!singleSelected || singleSelected.zIndex <= 1"
								@click="singleSelected && moveLayer(singleSelected.id, -1)"
							/>
							<UButton
								icon="i-lucide-bring-to-front"
								size="xs"
								color="neutral"
								variant="subtle"
								title="置顶"
								:disabled="!singleSelected || singleSelected.zIndex >= images.length"
								@click="singleSelected && moveLayerToEdge(singleSelected.id, 'top')"
							/>
							<UButton
								icon="i-lucide-send-to-back"
								size="xs"
								color="neutral"
								variant="subtle"
								title="置底"
								:disabled="!singleSelected || singleSelected.zIndex <= 1"
								@click="singleSelected && moveLayerToEdge(singleSelected.id, 'bottom')"
							/>
							<UButton
								icon="i-lucide-trash-2"
								size="xs"
								color="error"
								variant="subtle"
								title="删除选中图片"
								:disabled="selectedIds.length === 0"
								@click="() => { for (const id of [...selectedIds]) removeImage(id) }"
							/>
						</div>
					</div>
				</div>

				<!-- Nudge controls & position info for selected image(s) -->
				<div v-if="selectedIds.length > 0" class="flex flex-wrap items-center gap-3 text-sm">
					<span class="text-muted">微调 (1px):</span>
					<div class="flex gap-1">
						<UButton icon="i-lucide-arrow-up" size="xs" color="neutral" variant="subtle" @click="nudge(0, -1)" />
						<UButton icon="i-lucide-arrow-down" size="xs" color="neutral" variant="subtle" @click="nudge(0, 1)" />
						<UButton icon="i-lucide-arrow-left" size="xs" color="neutral" variant="subtle" @click="nudge(-1, 0)" />
						<UButton icon="i-lucide-arrow-right" size="xs" color="neutral" variant="subtle" @click="nudge(1, 0)" />
					</div>
					<template v-if="selectedIds.length === 1">
						<span class="text-muted">X:</span>
						<UInput
							:model-value="singleSelected?.x"
							type="number"
							class="w-20"
							@update:model-value="v => setPos('x', Number(v))"
						/>
						<span class="text-muted">Y:</span>
						<UInput
							:model-value="singleSelected?.y"
							type="number"
							class="w-20"
							@update:model-value="v => setPos('y', Number(v))"
						/>
						<span class="text-muted">W:</span>
						<UInput
							:model-value="singleSelected?.width"
							type="number"
							min="1"
							class="w-20"
							@update:model-value="v => setSize('width', Number(v))"
						/>
						<span class="text-muted">H:</span>
						<UInput
							:model-value="singleSelected?.height"
							type="number"
							min="1"
							class="w-20"
							@update:model-value="v => setSize('height', Number(v))"
						/>
					</template>
				</div>

				<!-- Background color -->
				<div class="flex items-center gap-2 text-sm">
					<span class="text-muted">画布背景:</span>
					<input v-model="canvasBg" type="color" class="w-8 h-8 rounded cursor-pointer border border-muted" />
					<span class="text-muted font-mono text-xs">{{ canvasBg }}</span>
				</div>
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
interface StitchImage {
	id: string
	name: string
	src: string
	x: number
	y: number
	width: number
	height: number
	zIndex: number
}

// ---- History (undo/redo) ----
const MAX_HISTORY = 50
const history = ref<StitchImage[][]>([])
const historyIndex = ref(-1)

function snapshotImages(): StitchImage[] {
	return images.value.map(i => ({ ...i }))
}

function pushHistory() {
	// Discard any redo states ahead of current index
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

// ---- State ----
const images = ref<StitchImage[]>([])
const selectedIds = ref<string[]>([])
const canvasWidth = ref(1200)
const canvasHeight = ref(800)
const canvasBg = ref('#ffffff')
const zoom = ref(1)
const panOffset = ref({ x: 0, y: 0 })
const canvasContainerRef = ref<HTMLElement | null>(null)
const showExportPanel = ref(false)

// ---- Pan state ----
const spaceDown = ref(false)
const isPanning = ref(false)
interface PanState { startMouseX: number; startMouseY: number; startPanX: number; startPanY: number }
const panState = ref<PanState | null>(null)

function onContainerMouseDown(e: MouseEvent) {
	// Middle-button drag or Space+left-button drag to pan
	if (e.button === 1 || (e.button === 0 && spaceDown.value)) {
		e.preventDefault()
		isPanning.value = true
		panState.value = {
			startMouseX: e.clientX,
			startMouseY: e.clientY,
			startPanX: panOffset.value.x,
			startPanY: panOffset.value.y,
		}
	}
}

function onWheel(e: WheelEvent) {
	e.preventDefault()
	if (e.ctrlKey) {
		// Pinch-to-zoom
		const delta = -e.deltaY * (e.deltaMode === 1 ? 0.1 : 0.002)
		zoom.value = Math.min(4, Math.max(0.1, +(zoom.value + delta).toFixed(3)))
	} else {
		// Two-finger scroll → pan
		panOffset.value = {
			x: panOffset.value.x - e.deltaX,
			y: panOffset.value.y - e.deltaY,
		}
	}
}

// Export options
const exportFormat = ref('image/png')
const exportWidth = ref(canvasWidth.value)
const exportHeight = ref(canvasHeight.value)
const exportQuality = ref(90)

const formatOptions = [
	{ label: 'PNG', value: 'image/png' },
	{ label: 'JPEG', value: 'image/jpeg' },
	{ label: 'WebP', value: 'image/webp' },
]

watch(canvasWidth, v => { exportWidth.value = v })
watch(canvasHeight, v => { exportHeight.value = v })

// ---- Derived ----
const sortedImages = computed(() =>
	[...images.value].sort((a, b) => a.zIndex - b.zIndex),
)

const singleSelected = computed(() =>
	selectedIds.value.length === 1
		? images.value.find(i => i.id === selectedIds.value[0])
		: undefined,
)

// ---- File input ----
const fileInputRef = ref<HTMLInputElement | null>(null)
function triggerFileInput() {
	fileInputRef.value?.click()
}

function onFilesSelected(e: Event) {
	const files = (e.target as HTMLInputElement).files
	if (!files) return
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
	// Reset so same file can be re-added
	;(e.target as HTMLInputElement).value = ''
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

// ---- Drag to move ----
interface DragState {
	id: string
	startMouseX: number
	startMouseY: number
	startX: number
	startY: number
}
const dragging = ref<DragState | null>(null)

function startDrag(e: MouseEvent, id: string) {
	if (e.button !== 0) return
	// If not selected, select it first (unless multi-selecting)
	if (!selectedIds.value.includes(id)) {
		selectImage(e, id)
	}
	const img = images.value.find(i => i.id === id)
	if (!img) return
	dragging.value = {
		id,
		startMouseX: e.clientX,
		startMouseY: e.clientY,
		startX: img.x,
		startY: img.y,
	}
}

// Store per-image offsets for multi-drag
const multiDragOrigins = ref<Record<string, { x: number; y: number }>>({})

function onMouseMove(e: MouseEvent) {
	if (isPanning.value && panState.value) {
		panOffset.value = {
			x: panState.value.startPanX + (e.clientX - panState.value.startMouseX),
			y: panState.value.startPanY + (e.clientY - panState.value.startMouseY),
		}
		return
	}

	if (dragging.value) {
		const dx = Math.round((e.clientX - dragging.value.startMouseX) / zoom.value)
		const dy = Math.round((e.clientY - dragging.value.startMouseY) / zoom.value)

		if (selectedIds.value.length > 1 && selectedIds.value.includes(dragging.value.id)) {
			// Move all selected images together
			for (const selId of selectedIds.value) {
				const img = images.value.find(i => i.id === selId)
				const origin = multiDragOrigins.value[selId]
				if (img && origin) {
					img.x = origin.x + dx
					img.y = origin.y + dy
				}
			}
		} else {
			const img = images.value.find(i => i.id === dragging.value!.id)
			if (img) {
				img.x = dragging.value.startX + dx
				img.y = dragging.value.startY + dy
			}
		}
	}

	if (resizing.value) {
		const dx = Math.round((e.clientX - resizing.value.startMouseX) / zoom.value)
		const dy = Math.round((e.clientY - resizing.value.startMouseY) / zoom.value)
		const img = images.value.find(i => i.id === resizing.value!.id)
		if (img) {
			img.width = Math.max(10, resizing.value.startWidth + dx)
			img.height = Math.max(10, resizing.value.startHeight + dy)
		}
	}
}


function onMouseUp() {
	const wasDragging = !!dragging.value
	const wasResizing = !!resizing.value
	dragging.value = null
	resizing.value = null
	multiDragOrigins.value = {}
	isPanning.value = false
	panState.value = null
	if (wasDragging || wasResizing) pushHistory()
}

// ---- Resize ----
interface ResizeState {
	id: string
	startMouseX: number
	startMouseY: number
	startWidth: number
	startHeight: number
}
const resizing = ref<ResizeState | null>(null)

function startResize(e: MouseEvent, id: string) {
	if (e.button !== 0) return
	const img = images.value.find(i => i.id === id)
	if (!img) return
	resizing.value = {
		id,
		startMouseX: e.clientX,
		startMouseY: e.clientY,
		startWidth: img.width,
		startHeight: img.height,
	}
}

// ---- Nudge (1px move) ----
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

// ---- Layer drag-to-reorder ----
// The list renders highest-z first (reverse of sortedImages).
// "before" a row = higher in list = higher zIndex; "after" = lower zIndex.
const layerDragging = ref<string | null>(null)
const layerDragOver = ref<string | null>(null)
const layerDragPos = ref<'before' | 'after'>('before')

function onLayerDragStart(e: DragEvent, id: string) {
	layerDragging.value = id
	e.dataTransfer!.effectAllowed = 'move'
}

function onLayerDragEnd() {
	layerDragging.value = null
	layerDragOver.value = null
}

function onLayerDragOver(e: DragEvent, id: string) {
	if (layerDragging.value === id) return
	layerDragOver.value = id
	// Upper half → insert before (higher z), lower half → insert after (lower z)
	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
	layerDragPos.value = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

function onLayerDragLeave(id: string) {
	if (layerDragOver.value === id) layerDragOver.value = null
}

function onLayerDrop(_e: DragEvent, targetId: string | null) {
	const srcId = layerDragging.value
	layerDragging.value = null
	layerDragOver.value = null
	if (!srcId || srcId === targetId) return

	// Build ordered list (highest z first, as rendered)
	const ordered = [...sortedImages.value].reverse()
	const srcIdx = ordered.findIndex(i => i.id === srcId)
	if (srcIdx === -1) return

	// Remove src from list
	const srcImg = ordered.splice(srcIdx, 1)[0]
	if (!srcImg) return

	if (targetId === null) {
		// Dropped on empty area at bottom → lowest z
		ordered.push(srcImg)
	} else {
		const tgtIdx = ordered.findIndex(i => i.id === targetId)
		if (tgtIdx === -1) return
		const insertIdx = layerDragPos.value === 'before' ? tgtIdx : tgtIdx + 1
		ordered.splice(insertIdx, 0, srcImg)
	}

	// Re-assign zIndex: last in array = lowest z = 1
	const total = ordered.length
	ordered.forEach((img, idx) => {
		img.zIndex = total - idx
	})
	pushHistory()
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

function removeImage(id: string) {
	images.value = images.value.filter(i => i.id !== id)
	selectedIds.value = selectedIds.value.filter(s => s !== id)
	pushHistory()
}

// ---- Alignment ----
type AlignEdge = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'middle'
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
async function exportImage() {
	const canvas = document.createElement('canvas')
	const scaleX = exportWidth.value / canvasWidth.value
	const scaleY = exportHeight.value / canvasHeight.value
	canvas.width = exportWidth.value
	canvas.height = exportHeight.value
	const ctx = canvas.getContext('2d')
	if (!ctx) return

	// Background
	ctx.fillStyle = canvasBg.value
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	// Draw images in z-order
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

	const quality = exportFormat.value === 'image/png' ? undefined : exportQuality.value / 100
	const dataUrl = canvas.toDataURL(exportFormat.value, quality)

	const ext = exportFormat.value === 'image/png'
		? 'png'
		: exportFormat.value === 'image/jpeg'
			? 'jpg'
			: 'webp'

	const a = document.createElement('a')
	a.href = dataUrl
	a.download = `stitched-image.${ext}`
	a.click()
}

// Push initial empty snapshot so undo stack starts at index 0
pushHistory()

// ---- Keyboard shortcuts ----
onMounted(() => {
	window.addEventListener('mousemove', onMouseMove)
	window.addEventListener('mouseup', onMouseUp)
	window.addEventListener('keydown', onKeyDown)
	window.addEventListener('keyup', onKeyUp)
	// Register wheel with passive:false so we can call preventDefault() for pinch-zoom,
	// while still letting plain two-finger scroll (no ctrlKey) bubble through normally.
	canvasContainerRef.value?.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
	window.removeEventListener('mousemove', onMouseMove)
	window.removeEventListener('mouseup', onMouseUp)
	window.removeEventListener('keydown', onKeyDown)
	window.removeEventListener('keyup', onKeyUp)
	canvasContainerRef.value?.removeEventListener('wheel', onWheel)
	// Clean up object URLs
	for (const img of images.value) {
		URL.revokeObjectURL(img.src)
	}
})

// Capture origins when drag starts
watch(dragging, (val) => {
	if (val && selectedIds.value.length > 1 && selectedIds.value.includes(val.id)) {
		multiDragOrigins.value = {}
		for (const selId of selectedIds.value) {
			const img = images.value.find(i => i.id === selId)
			if (img) multiDragOrigins.value[selId] = { x: img.x, y: img.y }
		}
	}
})

function onKeyDown(e: KeyboardEvent) {
	if (e.key === ' ' && !e.repeat) {
		e.preventDefault()
		spaceDown.value = true
	}
	const ctrl = e.ctrlKey || e.metaKey
	if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
	if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }
	if (selectedIds.value.length === 0) return
	// Arrow keys: 1px nudge (shift = 10px)
	const step = e.shiftKey ? 10 : 1
	if (e.key === 'ArrowUp') { e.preventDefault(); nudge(0, -step) }
	if (e.key === 'ArrowDown') { e.preventDefault(); nudge(0, step) }
	if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-step, 0) }
	if (e.key === 'ArrowRight') { e.preventDefault(); nudge(step, 0) }
	if (e.key === 'Delete' || e.key === 'Backspace') {
		for (const id of [...selectedIds.value]) removeImage(id)
	}
}

function onKeyUp(e: KeyboardEvent) {
	if (e.key === ' ') {
		spaceDown.value = false
		isPanning.value = false
		panState.value = null
	}
}
</script>
