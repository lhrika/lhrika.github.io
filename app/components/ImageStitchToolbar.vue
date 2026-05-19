<template>
	<div class="flex flex-col gap-2">
		<!-- Row 1: always visible -->
		<div class="flex gap-2 items-center">
			<!-- Project: open / save — collapsed into dropdown -->
			<UFileUpload
				v-model="projectFile"
				accept=".stitch"
				:preview="false"
				:dropzone="false"
			>
				<template #default="{ open: openProjectPicker }">
					<UDropdownMenu :items="projectMenuItems(openProjectPicker)">
						<UButton
							icon="i-lucide-folder"
							label="项目"
							color="neutral"
							variant="outline"
							trailing-icon="i-lucide-chevron-down"
						/>
					</UDropdownMenu>
				</template>
			</UFileUpload>

			<!-- Add images -->
			<UFileUpload
				v-model="imageFiles"
				accept="image/*"
				multiple
				:preview="false"
				:dropzone="false"
			>
				<template #default="{ open: openImagePicker }">
					<UButton
						icon="i-lucide-image-plus"
						label="添加图片"
						@click="() => openImagePicker()"
					/>
				</template>
			</UFileUpload>

			<!-- Canvas size + background -->
			<div class="flex items-center gap-1">
				<UFieldGroup>
					<UTooltip text="画布背景色">
						<UPopover>
							<UButton color="neutral" variant="outline" size="sm">
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
										@update:model-value="
											emit('update:canvasBg', $event as string)
										"
									/>
								</div>
							</template>
						</UPopover>
					</UTooltip>
					<UInputNumber
						:model-value="canvasWidth"
						:min="100"
						:max="10000"
						:increment="false"
						:decrement="false"
						class="w-16"
						placeholder="宽"
						@update:model-value="onCanvasWidth($event ?? canvasWidth)"
					/>
					<UTooltip :text="canvasLocked ? '解锁比例' : '锁定比例'">
						<UButton
							:icon="canvasLocked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
							color="neutral"
							variant="subtle"
							size="xs"
							class="px-1"
							@click="canvasLocked = !canvasLocked"
						/>
					</UTooltip>
					<UInputNumber
						:model-value="canvasHeight"
						:min="100"
						:max="10000"
						:increment="false"
						:decrement="false"
						class="w-16"
						placeholder="高"
						@update:model-value="onCanvasHeight($event ?? canvasHeight)"
					/>
					<UBadge color="neutral" variant="subtle" size="lg" label="px" />
					<UTooltip text="裁剪画布：去掉没有图片的空白区域">
						<UButton
							icon="i-lucide-crop"
							color="neutral"
							variant="subtle"
							:disabled="imageCount === 0"
							@click="emit('cropToContent')"
						/>
					</UTooltip>
				</UFieldGroup>
			</div>

			<!-- Zoom -->
			<UInputNumber
				increment-icon="i-lucide-zoom-in"
				decrement-icon="i-lucide-zoom-out"
				color="neutral"
				variant="outline"
				:model-value="zoom"
				:min="0.1"
				:max="4"
				:step="0.1"
				:format-options="{ style: 'percent' }"
				class="w-28"
				@update:model-value="v => emit('update:zoom', +(v ?? 1).toFixed(2))"
			/>

			<!-- Undo / Redo -->
			<UFieldGroup>
				<UTooltip text="撤销 (⌘Z)">
					<UButton
						icon="i-lucide-undo-2"
						color="neutral"
						variant="subtle"
						:disabled="!canUndo"
						@click="emit('undo')"
					/>
				</UTooltip>
				<UTooltip text="重做 (⌘⇧Z)">
					<UButton
						icon="i-lucide-redo-2"
						color="neutral"
						variant="subtle"
						:disabled="!canRedo"
						@click="emit('redo')"
					/>
				</UTooltip>
			</UFieldGroup>

			<div class="flex-1" />

			<UFieldGroup>
				<UTooltip text="画布恢复到中心位置">
					<UButton
						icon="i-lucide-locate"
						color="neutral"
						variant="subtle"
						@click="emit('resetPan')"
					/>
				</UTooltip>
				<UTooltip text="参照缩略图自动定位所有图片">
					<UButton
						icon="i-lucide-scan-search"
						color="neutral"
						variant="subtle"
						:disabled="imageCount < 2"
						:loading="thumbAligning"
						@click="emit('thumbAlign')"
					/>
				</UTooltip>
				<UTooltip text="清空画布">
					<UButton
						icon="i-lucide-trash-2"
						color="error"
						variant="subtle"
						:disabled="imageCount === 0"
						@click="emit('clearAll')"
					/>
				</UTooltip>
			</UFieldGroup>

			<!-- Export -->
			<UButton
				icon="i-lucide-download"
				label="导出"
				color="primary"
				variant="outline"
				:disabled="imageCount === 0"
				@click="emit('toggleExport')"
			/>

			<!-- Fullscreen -->
			<UTooltip :text="isFullscreen ? '退出全屏' : '全屏'">
				<UButton
					:icon="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'"
					color="neutral"
					variant="subtle"
					@click="emit('toggleFullscreen')"
				/>
			</UTooltip>
		</div>

		<!-- Row 2: auto-stitch + alignment (only when ≥2 selected) -->
		<div v-if="selectedCount >= 2" class="flex gap-2 items-center">
			<UButton
				v-if="canAutoAlign"
				icon="i-lucide-combine"
				label="自动拼接"
				color="primary"
				variant="subtle"
				:loading="autoAligning"
				@click="emit('autoAlign')"
			/>
			<div v-if="canAutoAlign" class="w-px h-6 bg-muted" />
			<UFieldGroup>
				<UTooltip text="组合选中图层">
					<UButton
						icon="i-lucide-group"
						label="组合"
						color="neutral"
						variant="subtle"
						@click="emit('groupSelected')"
					/>
				</UTooltip>
				<UTooltip text="解除组合">
					<UButton
						icon="i-lucide-ungroup"
						label="解组"
						color="neutral"
						variant="subtle"
						:disabled="!selectedHaveGroup"
						@click="emit('ungroupSelected')"
					/>
				</UTooltip>
			</UFieldGroup>
			<div class="w-px h-6 bg-muted" />
			<span class="text-sm text-muted">对齐:</span>
			<UFieldGroup>
				<UTooltip text="顶部对齐">
					<UButton
						icon="i-lucide-align-start-horizontal"
						color="neutral"
						variant="subtle"
						@click="emit('align', 'top')"
					/>
				</UTooltip>
				<UTooltip text="垂直居中">
					<UButton
						icon="i-lucide-align-center-horizontal"
						color="neutral"
						variant="subtle"
						@click="emit('align', 'middle')"
					/>
				</UTooltip>
				<UTooltip text="底部对齐">
					<UButton
						icon="i-lucide-align-end-horizontal"
						color="neutral"
						variant="subtle"
						@click="emit('align', 'bottom')"
					/>
				</UTooltip>
				<UTooltip text="左侧对齐">
					<UButton
						icon="i-lucide-align-start-vertical"
						color="neutral"
						variant="subtle"
						@click="emit('align', 'left')"
					/>
				</UTooltip>
				<UTooltip text="水平居中">
					<UButton
						icon="i-lucide-align-center-vertical"
						color="neutral"
						variant="subtle"
						@click="emit('align', 'center')"
					/>
				</UTooltip>
				<UTooltip text="右侧对齐">
					<UButton
						icon="i-lucide-align-end-vertical"
						color="neutral"
						variant="subtle"
						@click="emit('align', 'right')"
					/>
				</UTooltip>
			</UFieldGroup>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { AlignEdge } from '~/composables/useImageStitch'

const props = defineProps<{
	canvasWidth: number
	canvasHeight: number
	canvasBg: string
	zoom: number
	canUndo: boolean
	canRedo: boolean
	selectedCount: number
	imageCount: number
	autoAligning?: boolean
	thumbAligning?: boolean
	isFullscreen?: boolean
	selectedHaveGroup?: boolean
	canAutoAlign?: boolean
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
	resetPan: []
	saveProject: []
	openProjectFile: [file: File]
	autoAlign: []
	thumbAlign: []
	toggleFullscreen: []
	groupSelected: []
	ungroupSelected: []
}>()

// ---- Canvas aspect-ratio lock ----
const canvasLocked = ref(false)

function onCanvasWidth(v: number) {
	emit('update:canvasWidth', v)
	if (canvasLocked.value && props.canvasWidth > 0) {
		emit(
			'update:canvasHeight',
			Math.max(100, Math.round((v * props.canvasHeight) / props.canvasWidth)),
		)
	}
}

function onCanvasHeight(v: number) {
	emit('update:canvasHeight', v)
	if (canvasLocked.value && props.canvasHeight > 0) {
		emit(
			'update:canvasWidth',
			Math.max(100, Math.round((v * props.canvasWidth) / props.canvasHeight)),
		)
	}
}

const imageFiles = ref<File[]>([])
watch(imageFiles, files => {
	if (files.length) {
		emit('addFiles', [...files])
		imageFiles.value = []
	}
})

const projectFile = ref<File | null>(null)
watch(projectFile, file => {
	if (file) {
		emit('openProjectFile', file)
		projectFile.value = null
	}
})

function projectMenuItems(openPicker: () => void) {
	return [
		[
			{
				label: '打开项目',
				icon: 'i-lucide-folder-open',
				onSelect: () => {
					if ('showOpenFilePicker' in window) {
						emit('openProjectFile', new File([], '__picker__'))
					} else {
						openPicker()
					}
				},
			},
			{
				label: '保存项目',
				icon: 'i-lucide-save',
				onSelect: () => emit('saveProject'),
			},
		],
	]
}
</script>
