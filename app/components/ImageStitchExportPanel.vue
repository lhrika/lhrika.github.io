<template>
	<UModal
		v-model:open="open"
		title="导出图片"
		:ui="{ content: 'max-w-4xl' }"
	>
		<template #body>
			<div class="flex gap-6">
				<!-- Options -->
				<div class="flex flex-col gap-4 shrink-0 w-56">
					<UFormField label="文件名">
						<UInput
							v-model="filename"
							class="w-full"
							placeholder="stitched-image"
						/>
					</UFormField>
					<UFormField label="格式">
						<USelect v-model="format" :items="formatOptions" class="w-full" />
					</UFormField>
					<UFormField v-if="format !== 'image/png'" label="质量 (1–100)">
						<UInputNumber v-model="quality" :min="1" :max="100" class="w-full" />
					</UFormField>
					<UFormField label="宽度 (px)">
						<UInputNumber
							:model-value="width"
							:min="1"
							:max="20000"
							class="w-full"
							@update:model-value="onWidth"
						/>
					</UFormField>
					<div class="flex items-center gap-2">
						<div class="flex-1 border-t border-muted" />
						<UTooltip :text="locked ? '解锁比例' : '锁定比例'">
							<UButton
								:icon="locked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
								color="neutral"
								variant="ghost"
								size="xs"
								@click="locked = !locked"
							/>
						</UTooltip>
						<div class="flex-1 border-t border-muted" />
					</div>
					<UFormField label="高度 (px)">
						<UInputNumber
							:model-value="height"
							:min="1"
							:max="20000"
							class="w-full"
							@update:model-value="onHeight"
						/>
					</UFormField>
					<UButton
						label="刷新预览"
						icon="i-lucide-refresh-cw"
						color="neutral"
						variant="outline"
						:loading="previewing"
						@click="refreshPreview"
					/>
				</div>

				<!-- Preview -->
				<div class="flex-1 flex flex-col gap-2 min-w-0">
					<div class="text-sm font-medium text-muted">预览</div>
					<div
						class="flex-1 min-h-80 flex items-center justify-center rounded-lg border border-muted bg-[#e5e7eb] overflow-hidden"
					>
						<template v-if="previewing">
							<div class="flex flex-col items-center gap-2 text-muted text-sm">
								<UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
								<span>生成预览中…</span>
							</div>
						</template>
						<template v-else-if="previewUrl">
							<img
								:src="previewUrl"
								class="max-w-full max-h-[480px] object-contain rounded shadow"
							/>
						</template>
						<template v-else>
							<div class="flex flex-col items-center gap-2 text-muted text-sm">
								<UIcon name="i-lucide-image" class="size-8 opacity-40" />
								<span>点击「刷新预览」生成预览图</span>
							</div>
						</template>
					</div>
					<div v-if="previewUrl" class="text-xs text-muted text-right">
						{{ width }} × {{ height }} px · {{ format === 'image/png' ? 'PNG' : format === 'image/jpeg' ? 'JPEG' : 'WebP' }}
					</div>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex justify-end gap-2">
				<UButton
					label="取消"
					color="neutral"
					variant="outline"
					@click="open = false"
				/>
				<UButton
					label="导出"
					icon="i-lucide-download"
					color="primary"
					:loading="exporting"
					@click="onExport"
				/>
			</div>
		</template>
	</UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
	canvasWidth: number
	canvasHeight: number
	renderImage: (opts: { format: string; width: number; height: number; quality: number }) => Promise<{ dataUrl: string; ext: string }>
	exportImage: (opts: { format: string; width: number; height: number; quality: number; filename?: string }) => Promise<void>
}>()

const open = defineModel<boolean>('open', { default: false })

const formatOptions = [
	{ label: 'PNG', value: 'image/png' },
	{ label: 'JPEG', value: 'image/jpeg' },
	{ label: 'WebP', value: 'image/webp' },
]

const filename = ref('stitched-image')
const format = ref('image/png')
const width = ref(props.canvasWidth)
const height = ref(props.canvasHeight)
const quality = ref(90)

watch(() => props.canvasWidth, v => { width.value = v })
watch(() => props.canvasHeight, v => { height.value = v })

const { locked, onWidth: _onWidth, onHeight: _onHeight } = useAspectRatioLock(
	() => width.value,
	() => height.value,
)

function onWidth(v: number | null) {
	if (v == null) return
	const result = _onWidth(v)
	width.value = result.width
	height.value = result.height
}

function onHeight(v: number | null) {
	if (v == null) return
	const result = _onHeight(v)
	width.value = result.width
	height.value = result.height
}

// ---- Preview ----
const previewUrl = ref<string | null>(null)
const previewing = ref(false)

// Auto-refresh preview when modal opens
watch(open, v => {
	if (v) refreshPreview()
	else previewUrl.value = null
})

async function refreshPreview() {
	previewing.value = true
	try {
		const { dataUrl } = await props.renderImage({
			format: format.value,
			width: width.value,
			height: height.value,
			quality: quality.value,
		})
		previewUrl.value = dataUrl
	} finally {
		previewing.value = false
	}
}

// ---- Export ----
const exporting = ref(false)
const toast = useToast()

async function onExport() {
	exporting.value = true
	try {
		await props.exportImage({
			format: format.value,
			width: width.value,
			height: height.value,
			quality: quality.value,
			filename: filename.value || 'stitched-image',
		})
		toast.add({ title: '导出成功', color: 'success', icon: 'i-lucide-check-circle' })
		open.value = false
	} catch {
		toast.add({ title: '导出失败', color: 'error', icon: 'i-lucide-circle-x' })
	} finally {
		exporting.value = false
	}
}
</script>
