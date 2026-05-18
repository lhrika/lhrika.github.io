<template>
	<div class="flex flex-wrap gap-2 items-center">
		<!-- Project: open / save -->
		<UFileUpload
			v-model="projectFile"
			accept=".stitch"
			:preview="false"
			:dropzone="false"
		>
			<template #default="{ open: openProjectPicker }">
				<UButton icon="i-lucide-folder-open" label="打开项目" color="neutral" variant="outline" @click="onOpenProject(openProjectPicker)" />
			</template>
		</UFileUpload>
		<UButton icon="i-lucide-save" label="保存项目" color="neutral" variant="outline" @click="emit('saveProject')" />

		<div class="w-px h-6 bg-muted mx-1" />

		<!-- Add images -->
		<UFileUpload
			v-model="imageFiles"
			accept="image/*"
			multiple
			:preview="false"
			:dropzone="false"
		>
			<template #default="{ open: openImagePicker }">
				<UButton icon="i-lucide-image-plus" label="添加图片" @click="() => openImagePicker()" />
			</template>
		</UFileUpload>

		<!-- Canvas size -->
		<div class="flex items-center gap-1">
			<UInput
				:model-value="canvasWidth"
				type="number"
				min="100"
				max="10000"
				class="w-24"
				placeholder="宽"
				@update:model-value="emit('update:canvasWidth', Number($event))"
			/>
			<span class="text-muted text-sm">×</span>
			<UInput
				:model-value="canvasHeight"
				type="number"
				min="100"
				max="10000"
				class="w-24"
				placeholder="高"
				@update:model-value="emit('update:canvasHeight', Number($event))"
			/>
			<span class="text-muted text-sm">px</span>
			<UPopover>
				<UButton
					color="neutral"
					variant="outline"
					class="w-7 h-7 p-0 shrink-0"
					title="画布背景色"
				>
					<span
						class="block w-4 h-4 rounded-sm border border-muted"
						:style="{ background: canvasBg }"
					/>
				</UButton>
				<template #content>
					<div class="p-2">
						<UColorPicker
							:model-value="canvasBg"
							format="hex"
							@update:model-value="emit('update:canvasBg', $event as string)"
						/>
					</div>
				</template>
			</UPopover>
		</div>

		<!-- Zoom -->
		<div class="flex items-center gap-1">
			<UButton
				icon="i-lucide-zoom-out"
				color="neutral"
				variant="subtle"
				:disabled="zoom <= 0.1"
				@click="emit('update:zoom', Math.max(0.1, +(zoom - 0.1).toFixed(1)))"
			/>
			<span class="text-sm w-12 text-center">{{ Math.round(zoom * 100) }}%</span>
			<UButton
				icon="i-lucide-zoom-in"
				color="neutral"
				variant="subtle"
				:disabled="zoom >= 4"
				@click="emit('update:zoom', Math.min(4, +(zoom + 0.1).toFixed(1)))"
			/>
		</div>

		<!-- Undo / Redo -->
		<UButton
			icon="i-lucide-undo-2"
			color="neutral"
			variant="subtle"
			title="撤销 (Ctrl+Z)"
			:disabled="!canUndo"
			@click="emit('undo')"
		/>
		<UButton
			icon="i-lucide-redo-2"
			color="neutral"
			variant="subtle"
			title="重做 (Ctrl+Shift+Z)"
			:disabled="!canRedo"
			@click="emit('redo')"
		/>

		<div class="flex-1" />

		<!-- Auto stitch (only when exactly 2 selected) -->
		<UButton
			v-if="selectedCount === 2"
			icon="i-lucide-combine"
			label="自动拼接"
			color="primary"
			variant="subtle"
			:loading="autoAligning"
			title="自动检测两图重叠区域并对齐"
			@click="emit('autoAlign')"
		/>

		<!-- Alignment (only when ≥2 selected) -->
		<template v-if="selectedCount >= 2">
			<span class="text-sm text-muted">对齐:</span>
			<UButton icon="i-lucide-align-start-horizontal" color="neutral" variant="subtle" title="顶部对齐" @click="emit('align', 'top')" />
			<UButton icon="i-lucide-align-center-horizontal" color="neutral" variant="subtle" title="垂直居中对齐" @click="emit('align', 'middle')" />
			<UButton icon="i-lucide-align-end-horizontal" color="neutral" variant="subtle" title="底部对齐" @click="emit('align', 'bottom')" />
			<UButton icon="i-lucide-align-start-vertical" color="neutral" variant="subtle" title="左侧对齐" @click="emit('align', 'left')" />
			<UButton icon="i-lucide-align-center-vertical" color="neutral" variant="subtle" title="水平居中对齐" @click="emit('align', 'center')" />
			<UButton icon="i-lucide-align-end-vertical" color="neutral" variant="subtle" title="右侧对齐" @click="emit('align', 'right')" />
		</template>

		<!-- Crop to content -->
		<UButton
			icon="i-lucide-crop"
			color="neutral"
			variant="subtle"
			title="裁剪画布：去掉没有图片的空白区域"
			:disabled="imageCount === 0"
			@click="emit('cropToContent')"
		/>

		<!-- Clear all -->
		<UButton
			icon="i-lucide-trash-2"
			color="error"
			variant="subtle"
			title="清空画布"
			:disabled="imageCount === 0"
			@click="emit('clearAll')"
		/>

		<!-- Export toggle -->
		<UButton
			icon="i-lucide-download"
			label="导出"
			color="primary"
			variant="outline"
			:disabled="imageCount === 0"
			@click="emit('toggleExport')"
		/>

		<!-- Fullscreen -->
		<UButton
			:icon="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'"
			color="neutral"
			variant="subtle"
			:title="isFullscreen ? '退出全屏' : '全屏'"
			@click="emit('toggleFullscreen')"
		/>
	</div>
</template>

<script setup lang="ts">
import type { AlignEdge } from '~/composables/useImageStitch'

defineProps<{
	canvasWidth: number
	canvasHeight: number
	canvasBg: string
	zoom: number
	canUndo: boolean
	canRedo: boolean
	selectedCount: number
	imageCount: number
	autoAligning?: boolean
	isFullscreen?: boolean
}>()

const emit = defineEmits<{
	'update:canvasWidth': [v: number]
	'update:canvasHeight': [v: number]
	'update:canvasBg': [v: string]
	'update:zoom': [v: number]
	undo: []
	redo: []
	align: [edge: AlignEdge]
	toggleExport: []
	addFiles: [files: File[]]
	clearAll: []
	cropToContent: []
	saveProject: []
	openProjectFile: [file: File]
	autoAlign: []
	toggleFullscreen: []
}>()

const imageFiles = ref<File[]>([])
watch(imageFiles, (files) => {
	if (files.length) {
		emit('addFiles', [...files])
		imageFiles.value = []
	}
})

const projectFile = ref<File | null>(null)
watch(projectFile, (file) => {
	if (file) {
		emit('openProjectFile', file)
		projectFile.value = null
	}
})

function onOpenProject(openPicker: () => void) {
	if ('showOpenFilePicker' in window) {
		emit('openProjectFile', new File([], '__picker__'))
		return
	}
	openPicker()
}
</script>
