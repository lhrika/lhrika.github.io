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
					:class="
						isFullscreen
							? 'flex flex-col p-3 gap-3 h-screen bg-default'
							: 'flex flex-col gap-4'
					"
				>
					<!-- 7. USkeleton loading state -->
					<template v-if="loading">
						<USkeleton class="h-10 w-full rounded-lg" />
						<USkeleton class="flex-1 min-h-100 w-full rounded-lg" />
					</template>

					<template v-else>
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
							:thumb-aligning="thumbAligning"
							:is-fullscreen="isFullscreen"
							@undo="undo"
							@redo="redo"
							@align="alignImages"
							@toggle-export="showExportPanel = !showExportPanel"
							@add-files="addFiles"
							@crop-to-content="onCropToContent"
							@clear-all="confirmClearAll"
							@save-project="onSaveProject"
							@open-project-file="onOpenProjectFile"
							@auto-align="onAutoAlign"
							@thumb-align="showThumbAlignModal = true"
							@reset-pan="canvasRef?.resetPan()"
							@toggle-fullscreen="toggle"
						/>

						<ImageStitchExportPanel
							v-if="showExportPanel"
							:canvas-width="canvasWidth"
							:canvas-height="canvasHeight"
							@export="onExport"
						/>

						<div
							class="flex gap-4 min-h-0"
							:class="isFullscreen ? 'flex-1' : ''"
						>
							<ImageStitchCanvas
								ref="canvasRef"
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
								@remove-selected="
									() => {
										for (const id of [...selectedIds]) removeImage(id)
									}
								"
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
					</template>
				</div>
			</UContainer>
		</UPageBody>

		<!-- Thumbnail-align modal: pick which image is the thumbnail -->
		<UModal
			v-model:open="showThumbAlignModal"
			title="选择缩略图"
			description="选择哪张图片是缩略图，其余图片将根据它的内容自动定位"
			:ui="{ footer: 'justify-end' }"
		>
			<template #body>
				<div class="flex flex-col gap-2">
					<div
						v-for="img in images"
						:key="img.id"
						class="flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors"
						:class="thumbId === img.id ? 'border-primary bg-primary/10' : 'border-muted hover:bg-muted/50'"
						@click="thumbId = img.id"
					>
						<img :src="img.src" class="w-16 h-12 object-cover rounded shrink-0" />
						<span class="text-sm truncate flex-1">{{ img.name }}</span>
						<UIcon v-if="thumbId === img.id" name="i-lucide-check-circle" class="text-primary shrink-0" />
					</div>
				</div>
			</template>
			<template #footer>
				<UButton label="取消" color="neutral" variant="outline" @click="showThumbAlignModal = false" />
				<UButton
					label="开始定位"
					icon="i-lucide-scan-search"
					color="primary"
					:disabled="!thumbId || images.length < 2"
					:loading="thumbAligning"
					@click="onThumbAlign"
				/>
			</template>
		</UModal>

		<!-- 2. Confirm clear all modal -->
		<UModal
			v-model:open="showClearModal"
			title="清空画布"
			:ui="{ footer: 'justify-end' }"
		>
			<template #body> 确定要清空所有图片吗？此操作不可撤销。 </template>
			<template #footer>
				<UButton
					label="取消"
					color="neutral"
					variant="outline"
					@click="showClearModal = false"
				/>
				<UButton
					label="清空"
					color="error"
					icon="i-lucide-trash-2"
					@click="onClearAll"
				/>
			</template>
		</UModal>
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
	alignByThumbnailSelected,
} = useImageStitch()

// 1. Toast feedback
const toast = useToast()

async function onOpenProjectFile(file: File) {
	if (file.name === '__picker__') {
		await pickAndLoadProject()
	} else {
		await loadProject(file)
	}
}

async function onSaveProject() {
	try {
		await saveProject()
		toast.add({
			title: '项目已保存',
			color: 'success',
			icon: 'i-lucide-check-circle',
		})
	} catch {
		toast.add({ title: '保存失败', color: 'error', icon: 'i-lucide-circle-x' })
	}
}

async function onExport(opts: {
	format: string
	width: number
	height: number
	quality: number
	filename: string
}) {
	try {
		await exportImage(opts)
		toast.add({
			title: '导出成功',
			color: 'success',
			icon: 'i-lucide-check-circle',
		})
	} catch {
		toast.add({ title: '导出失败', color: 'error', icon: 'i-lucide-circle-x' })
	}
}

function onCropToContent() {
	cropToContent()
	toast.add({
		title: '画布已裁剪',
		color: 'success',
		icon: 'i-lucide-crop',
		duration: 2000,
	})
}

const zoom = ref(1)
const showExportPanel = ref(false)
const autoAligning = ref(false)
const thumbAligning = ref(false)
const showThumbAlignModal = ref(false)
const thumbId = ref<string | null>(null)

async function onAutoAlign() {
	autoAligning.value = true
	const result = await autoAlignSelected()
	autoAligning.value = false
	if (result) {
		toast.add({
			title: '自动拼接完成',
			description: `重叠区域 ${result.overlap}px，置信度 ${Math.round(result.confidence * 100)}%`,
			color: 'success',
			icon: 'i-lucide-combine',
		})
	} else {
		toast.add({
			title: '未能找到匹配区域',
			color: 'warning',
			icon: 'i-lucide-triangle-alert',
		})
	}
}

async function onThumbAlign() {
	if (!thumbId.value) return
	showThumbAlignModal.value = false
	thumbAligning.value = true
	const result = await alignByThumbnailSelected(thumbId.value)
	thumbAligning.value = false
	thumbId.value = null
	if (result) {
		toast.add({
			title: '缩略图定位完成',
			description: `平均置信度 ${Math.round(result.avgConfidence * 100)}%`,
			color: 'success',
			icon: 'i-lucide-scan-search',
		})
	} else {
		toast.add({ title: '定位失败', color: 'warning', icon: 'i-lucide-triangle-alert' })
	}
}

function onDragEnd() {
	pushHistory()
}
function onResizeEnd() {
	pushHistory()
}

// 2. Clear all confirmation modal
const showClearModal = ref(false)

function confirmClearAll() {
	showClearModal.value = true
}

async function onClearAll() {
	showClearModal.value = false
	await clearAll()
	toast.add({
		title: '画布已清空',
		color: 'neutral',
		icon: 'i-lucide-trash-2',
		duration: 2000,
	})
}

// Canvas ref (for resetPan)
const canvasRef = ref<{ resetPan: () => void } | null>(null)

// Fullscreen
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

// 6. defineShortcuts for undo/redo
defineShortcuts({
	meta_z: () => undo(),
	meta_shift_z: () => redo(),
	ctrl_y: () => redo(),
})

function onKeyDown(e: KeyboardEvent) {
	// Undo/redo handled by defineShortcuts
	if (selectedIds.value.length === 0) return
	const step = e.shiftKey ? 10 : 1
	if (e.key === 'ArrowUp') {
		e.preventDefault()
		nudge(0, -step)
	}
	if (e.key === 'ArrowDown') {
		e.preventDefault()
		nudge(0, step)
	}
	if (e.key === 'ArrowLeft') {
		e.preventDefault()
		nudge(-step, 0)
	}
	if (e.key === 'ArrowRight') {
		e.preventDefault()
		nudge(step, 0)
	}
	if (e.key === 'Delete' || e.key === 'Backspace') {
		for (const id of [...selectedIds.value]) removeImage(id)
	}
}
</script>
