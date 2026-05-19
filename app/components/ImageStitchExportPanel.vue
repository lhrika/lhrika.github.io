<template>
	<!-- 3. UCard instead of hand-rolled card -->
	<UCard>
		<template #header>
			<span class="font-medium text-sm">导出选项</span>
		</template>
		<div class="flex flex-wrap gap-4 items-end">
			<UFormField label="文件名">
				<UInput v-model="filename" class="w-44" placeholder="stitched-image" />
			</UFormField>
			<UFormField label="格式">
				<USelect v-model="format" :items="formatOptions" class="w-28" />
			</UFormField>
			<!-- 4. UInputNumber for numeric fields -->
			<UFormField label="宽度 (px)">
				<UInputNumber :model-value="width" :min="1" :max="20000" class="w-32" @update:model-value="onWidth" />
			</UFormField>
			<UTooltip :text="locked ? '解锁比例' : '锁定比例'">
				<UButton
					:icon="locked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
					color="neutral"
					variant="ghost"
					size="xs"
					class="self-end mb-1"
					@click="locked = !locked"
				/>
			</UTooltip>
			<UFormField label="高度 (px)">
				<UInputNumber :model-value="height" :min="1" :max="20000" class="w-32" @update:model-value="onHeight" />
			</UFormField>
			<UFormField v-if="format !== 'image/png'" label="质量 (1-100)">
				<UInputNumber v-model="quality" :min="1" :max="100" class="w-28" />
			</UFormField>
			<UButton label="导出图片" icon="i-lucide-download" @click="onExport" />
		</div>
	</UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
	canvasWidth: number
	canvasHeight: number
}>()

const emit = defineEmits<{
	export: [
		opts: {
			format: string
			width: number
			height: number
			quality: number
			filename: string
		},
	]
}>()

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
const locked = ref(false)

watch(
	() => props.canvasWidth,
	v => { width.value = v },
)
watch(
	() => props.canvasHeight,
	v => { height.value = v },
)

function onWidth(v: number | null) {
	if (v == null) return
	if (locked.value && width.value > 0) {
		height.value = Math.max(1, Math.round(v * height.value / width.value))
	}
	width.value = v
}

function onHeight(v: number | null) {
	if (v == null) return
	if (locked.value && height.value > 0) {
		width.value = Math.max(1, Math.round(v * width.value / height.value))
	}
	height.value = v
}

function onExport() {
	emit('export', {
		format: format.value,
		width: width.value,
		height: height.value,
		quality: quality.value,
		filename: filename.value || 'stitched-image',
	})
}
</script>
