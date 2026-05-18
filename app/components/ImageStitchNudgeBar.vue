<template>
	<div class="flex flex-wrap items-center gap-3 text-sm">
		<span class="text-muted">微调 (1px):</span>
		<div class="flex gap-1">
			<UButton icon="i-lucide-arrow-up" size="xs" color="neutral" variant="subtle" @click="emit('nudge', 0, -1)" />
			<UButton icon="i-lucide-arrow-down" size="xs" color="neutral" variant="subtle" @click="emit('nudge', 0, 1)" />
			<UButton icon="i-lucide-arrow-left" size="xs" color="neutral" variant="subtle" @click="emit('nudge', -1, 0)" />
			<UButton icon="i-lucide-arrow-right" size="xs" color="neutral" variant="subtle" @click="emit('nudge', 1, 0)" />
		</div>
		<template v-if="singleSelected">
			<span class="text-muted">X:</span>
			<UInput :model-value="singleSelected.x" type="number" class="w-20" @update:model-value="emit('setPos', 'x', Number($event))" />
			<span class="text-muted">Y:</span>
			<UInput :model-value="singleSelected.y" type="number" class="w-20" @update:model-value="emit('setPos', 'y', Number($event))" />
			<span class="text-muted">W:</span>
			<UInput :model-value="singleSelected.width" type="number" min="1" class="w-20" @update:model-value="emit('setSize', 'width', Number($event))" />
			<span class="text-muted">H:</span>
			<UInput :model-value="singleSelected.height" type="number" min="1" class="w-20" @update:model-value="emit('setSize', 'height', Number($event))" />
		</template>
	</div>
</template>

<script setup lang="ts">
import type { StitchImage } from '~/composables/useImageStitch'

defineProps<{
	singleSelected: StitchImage | undefined
}>()

const emit = defineEmits<{
	nudge: [dx: number, dy: number]
	setPos: [axis: 'x' | 'y', value: number]
	setSize: [dim: 'width' | 'height', value: number]
}>()
</script>
