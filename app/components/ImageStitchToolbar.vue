<template>
	<div class="flex flex-wrap gap-2 items-center">
		<!-- Add images -->
		<UButton icon="i-lucide-image-plus" label="添加图片" @click="fileInputRef?.click()" />
		<input
			ref="fileInputRef"
			type="file"
			accept="image/*"
			multiple
			class="hidden"
			@change="onFilesChange"
		/>

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

		<!-- Export toggle -->
		<UButton
			icon="i-lucide-download"
			label="导出"
			color="primary"
			variant="outline"
			:disabled="imageCount === 0"
			@click="emit('toggleExport')"
		/>
	</div>
</template>

<script setup lang="ts">
import type { AlignEdge } from '~/composables/useImageStitch'

defineProps<{
	canvasWidth: number
	canvasHeight: number
	zoom: number
	canUndo: boolean
	canRedo: boolean
	selectedCount: number
	imageCount: number
}>()

const emit = defineEmits<{
	'update:canvasWidth': [v: number]
	'update:canvasHeight': [v: number]
	'update:zoom': [v: number]
	undo: []
	redo: []
	align: [edge: AlignEdge]
	toggleExport: []
	addFiles: [files: FileList]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

function onFilesChange(e: Event) {
	const files = (e.target as HTMLInputElement).files
	if (files?.length) emit('addFiles', files)
	;(e.target as HTMLInputElement).value = ''
}
</script>
