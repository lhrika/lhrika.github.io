<template>
	<div
		ref="containerRef"
		class="relative overflow-hidden border border-muted rounded-lg bg-[#e5e7eb] flex-1 min-h-100"
		:style="{
			maxHeight: fullscreen ? 'none' : '70vh',
			cursor: spaceDown ? (isPanning ? 'grabbing' : 'grab') : 'default',
		}"
		@mousedown="onContainerMouseDown"
	>
		<!-- Canvas surface -->
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
			@mousedown.self="emit('deselect')"
		>
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
				@click.stop="emit('select', $event, img.id)"
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
				<div
					v-if="selectedIds.includes(img.id)"
					class="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 opacity-80 cursor-se-resize"
					@mousedown.stop="startResize($event, img.id)"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { StitchImage } from '~/composables/useImageStitch'

const props = defineProps<{
	sortedImages: StitchImage[]
	selectedIds: string[]
	canvasWidth: number
	canvasHeight: number
	canvasBg: string
	zoom: number
	fullscreen?: boolean
	groupMemberIds: (id: string) => string[]
}>()

const emit = defineEmits<{
	select: [e: MouseEvent, id: string]
	deselect: []
	dragEnd: []
	resizeEnd: []
	'update:zoom': [value: number]
}>()

// ---- Pan ----
const panOffset = ref({ x: 0, y: 0 })
const spaceDown = ref(false)
const isPanning = ref(false)

interface PanState {
	startMouseX: number
	startMouseY: number
	startPanX: number
	startPanY: number
}
const panState = ref<PanState | null>(null)

function onContainerMouseDown(e: MouseEvent) {
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

// ---- Drag to move ----
interface DragState {
	id: string
	startMouseX: number
	startMouseY: number
	startX: number
	startY: number
}
const dragging = ref<DragState | null>(null)
const multiDragOrigins = ref<Record<string, { x: number; y: number }>>({})

function startDrag(e: MouseEvent, id: string) {
	if (e.button !== 0) return
	const img = props.sortedImages.find(i => i.id === id)
	if (!img) return
	dragging.value = {
		id,
		startMouseX: e.clientX,
		startMouseY: e.clientY,
		startX: img.x,
		startY: img.y,
	}
	// Capture origins for all images that should move together:
	// union of the current selection and the dragged image's group members
	const groupIds = props.groupMemberIds(id)
	const coMoveIds = props.selectedIds.includes(id) && props.selectedIds.length > 1
		? [...new Set([...props.selectedIds, ...groupIds])]
		: groupIds
	if (coMoveIds.length > 1) {
		multiDragOrigins.value = {}
		for (const selId of coMoveIds) {
			const selImg = props.sortedImages.find(i => i.id === selId)
			if (selImg) multiDragOrigins.value[selId] = { x: selImg.x, y: selImg.y }
		}
	}
}

// ---- Resize ----
interface ResizeState {
	id: string
	startMouseX: number
	startMouseY: number
	startWidth: number
	startHeight: number
	aspectRatio: number
}
const resizing = ref<ResizeState | null>(null)

function startResize(e: MouseEvent, id: string) {
	if (e.button !== 0) return
	const img = props.sortedImages.find(i => i.id === id)
	if (!img) return
	resizing.value = {
		id,
		startMouseX: e.clientX,
		startMouseY: e.clientY,
		startWidth: img.width,
		startHeight: img.height,
		aspectRatio: img.width / img.height,
	}
}

// ---- Global mouse events ----
function onMouseMove(e: MouseEvent) {
	if (isPanning.value && panState.value) {
		panOffset.value = {
			x: panState.value.startPanX + (e.clientX - panState.value.startMouseX),
			y: panState.value.startPanY + (e.clientY - panState.value.startMouseY),
		}
		return
	}

	if (dragging.value) {
		const dx = Math.round((e.clientX - dragging.value.startMouseX) / props.zoom)
		const dy = Math.round((e.clientY - dragging.value.startMouseY) / props.zoom)

		if (Object.keys(multiDragOrigins.value).length > 0) {
			for (const [selId, origin] of Object.entries(multiDragOrigins.value)) {
				const img = props.sortedImages.find(i => i.id === selId)
				if (img) {
					img.x = origin.x + dx
					img.y = origin.y + dy
				}
			}
		} else {
			const img = props.sortedImages.find(i => i.id === dragging.value!.id)
			if (img) {
				img.x = dragging.value.startX + dx
				img.y = dragging.value.startY + dy
			}
		}
	}

	if (resizing.value) {
		const dx = Math.round((e.clientX - resizing.value.startMouseX) / props.zoom)
		const dy = Math.round((e.clientY - resizing.value.startMouseY) / props.zoom)
		const img = props.sortedImages.find(i => i.id === resizing.value!.id)
		if (img) {
			let newW = Math.max(10, resizing.value.startWidth + dx)
			let newH = Math.max(10, resizing.value.startHeight + dy)
			if (e.shiftKey) {
				// Use whichever axis moved more to drive the constrained dimension
				if (Math.abs(dx) >= Math.abs(dy)) {
					newH = Math.max(10, Math.round(newW / resizing.value.aspectRatio))
				} else {
					newW = Math.max(10, Math.round(newH * resizing.value.aspectRatio))
				}
			}
			img.width = newW
			img.height = newH
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
	if (wasDragging) emit('dragEnd')
	if (wasResizing) emit('resizeEnd')
}

// ---- Wheel (zoom + pan) ----
const containerRef = ref<HTMLElement | null>(null)

function onWheel(e: WheelEvent) {
	e.preventDefault()
	if (e.ctrlKey) {
		const delta = -e.deltaY * (e.deltaMode === 1 ? 0.1 : 0.002)
		// Emit zoom change to parent via the zoom prop (parent controls zoom)
		// We communicate by emitting, but zoom is owned by parent.
		// Use a workaround: directly mutate via expose or use a local zoom.
		// Since zoom is a prop, we emit an update event.
		zoomEmit(Math.min(4, Math.max(0.1, +(props.zoom + delta).toFixed(3))))
	} else {
		panOffset.value = {
			x: panOffset.value.x - e.deltaX,
			y: panOffset.value.y - e.deltaY,
		}
	}
}

function zoomEmit(v: number) {
	emit('update:zoom', v)
}

// ---- Expose ----
defineExpose({
	resetPan: () => {
		panOffset.value = { x: 0, y: 0 }
	},
})

// ---- Keyboard ----
function onKeyDown(e: KeyboardEvent) {
	if (e.key === ' ' && !e.repeat) {
		e.preventDefault()
		spaceDown.value = true
	}
}
function onKeyUp(e: KeyboardEvent) {
	if (e.key === ' ') {
		spaceDown.value = false
		isPanning.value = false
		panState.value = null
	}
}

onMounted(() => {
	window.addEventListener('mousemove', onMouseMove)
	window.addEventListener('mouseup', onMouseUp)
	window.addEventListener('keydown', onKeyDown)
	window.addEventListener('keyup', onKeyUp)
	containerRef.value?.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
	window.removeEventListener('mousemove', onMouseMove)
	window.removeEventListener('mouseup', onMouseUp)
	window.removeEventListener('keydown', onKeyDown)
	window.removeEventListener('keyup', onKeyUp)
	containerRef.value?.removeEventListener('wheel', onWheel)
})
</script>
