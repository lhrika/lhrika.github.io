<template>
	<UPage>
		<UPageHeader
			title="图片拼接"
			description="将多张图片拼接成一张大图，支持自由移动、层次控制、对齐和导出"
		/>
		<UPageBody>
			<UContainer>
				<div
					ref="editorRef"
					:class="isFullscreen
						? 'flex flex-col p-3 gap-3 h-screen bg-default'
						: 'flex flex-col gap-4'"
				>
					<div v-if="loading" class="flex items-center gap-2 text-sm text-muted">
						<Icon name="i-lucide-loader-circle" class="size-4 animate-spin" />
						正在恢复上次编辑内容…
					</div>

					<ImageStitchToolbar
						v-model:canvas-width="canvasWidth"
						v-model:canvas-height="canvasHeight"
						v-model:canvas-bg="canvasBg"
						v-model:zoom="zoom"
						:can-undo="canUndo"
						:can-redo="canRedo"
						:selected-count="selectedIds.length"
						:image-count="images.length"
						:auto-aligning="autoAligning"
						:is-fullscreen="isFullscreen"
						@undo="undo"
						@redo="redo"
						@align="alignImages"
						@toggle-export="showExportPanel = !showExportPanel"
						@add-files="addFiles"
						@crop-to-content="cropToContent"
						@clear-all="clearAll"
						@save-project="saveProject"
						@open-project-file="onOpenProjectFile"
						@auto-align="onAutoAlign"
						@toggle-fullscreen="toggle"
					/>

					<ImageStitchExportPanel
						v-if="showExportPanel"
						:canvas-width="canvasWidth"
						:canvas-height="canvasHeight"
						@export="exportImage"
					/>

					<div class="flex gap-4 min-h-0" :class="isFullscreen ? 'flex-1' : ''">
						<ImageStitchCanvas
							:sorted-images="sortedImages"
							:selected-ids="selectedIds"
							:canvas-width="canvasWidth"
							:canvas-height="canvasHeight"
							:canvas-bg="canvasBg"
							:zoom="zoom"
							:fullscreen="isFullscreen"
							@update:zoom="zoom = $event"
							@select="selectImage"
							@deselect="deselectAll"
							@drag-end="onDragEnd"
							@resize-end="onResizeEnd"
						/>

						<ImageStitchLayerPanel
							v-if="images.length > 0"
							:sorted-images="sortedImages"
							:selected-ids="selectedIds"
							:single-selected="singleSelected"
							@select="selectImage"
							@move-layer="moveLayer"
							@move-layer-to-edge="moveLayerToEdge"
							@remove-selected="() => { for (const id of [...selectedIds]) removeImage(id) }"
							@reorder="reorderLayers"
						/>
					</div>

					<ImageStitchNudgeBar
						v-if="selectedIds.length > 0"
						:single-selected="singleSelected"
						@nudge="nudge"
						@set-pos="setPos"
						@set-size="setSize"
					/>
				</div>
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
import { useFullscreen } from '@vueuse/core'

const {
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
	restore,
	saveProject,
	loadProject,
	pickAndLoadProject,
	autoAlignSelected,
	cropToContent,
} = useImageStitch()

async function onOpenProjectFile(file: File) {
	if (file.name === '__picker__') {
		await pickAndLoadProject()
	} else {
		await loadProject(file)
	}
}

const zoom = ref(1)
const showExportPanel = ref(false)
const autoAligning = ref(false)

async function onAutoAlign() {
	autoAligning.value = true
	await autoAlignSelected()
	autoAligning.value = false
}

function onDragEnd() { pushHistory() }
function onResizeEnd() { pushHistory() }

// ---- Fullscreen ----
const editorRef = ref<HTMLElement | null>(null)
const { isFullscreen, toggle } = useFullscreen(editorRef)

onMounted(async () => {
	await restore()
	window.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
	window.removeEventListener('keydown', onKeyDown)
	cleanupObjectURLs()
})

function onKeyDown(e: KeyboardEvent) {
	const ctrl = e.ctrlKey || e.metaKey
	if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
	if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return }
	if (selectedIds.value.length === 0) return
	const step = e.shiftKey ? 10 : 1
	if (e.key === 'ArrowUp') { e.preventDefault(); nudge(0, -step) }
	if (e.key === 'ArrowDown') { e.preventDefault(); nudge(0, step) }
	if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-step, 0) }
	if (e.key === 'ArrowRight') { e.preventDefault(); nudge(step, 0) }
	if (e.key === 'Delete' || e.key === 'Backspace') {
		for (const id of [...selectedIds.value]) removeImage(id)
	}
}
</script>
