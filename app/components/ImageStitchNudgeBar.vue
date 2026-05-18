<template>
	<div class="flex flex-wrap items-center gap-3 text-sm">
		<!-- Nudge buttons -->
		<div class="flex items-center gap-1">
			<span class="text-muted">微调:</span>
			<UFieldGroup size="xs">
				<UTooltip text="上移 (↑)">
					<UButton icon="i-lucide-arrow-up" color="neutral" variant="subtle" @click="emit('nudge', 0, -1)" />
				</UTooltip>
				<UTooltip text="下移 (↓)">
					<UButton icon="i-lucide-arrow-down" color="neutral" variant="subtle" @click="emit('nudge', 0, 1)" />
				</UTooltip>
				<UTooltip text="左移 (←)">
					<UButton icon="i-lucide-arrow-left" color="neutral" variant="subtle" @click="emit('nudge', -1, 0)" />
				</UTooltip>
				<UTooltip text="右移 (→)">
					<UButton icon="i-lucide-arrow-right" color="neutral" variant="subtle" @click="emit('nudge', 1, 0)" />
				</UTooltip>
			</UFieldGroup>
		</div>

		<!-- Position & size inputs (single selection only) -->
		<template v-if="singleSelected">
			<div class="w-px h-4 bg-muted" />
			<div class="flex items-center gap-2">
				<UFormField label="X" size="xs" class="flex items-center gap-1">
					<UInputNumber
						:model-value="singleSelected.x"
						size="xs"
						class="w-20"
						@update:model-value="v => emit('setPos', 'x', v ?? singleSelected!.x)"
					/>
				</UFormField>
				<UFormField label="Y" size="xs" class="flex items-center gap-1">
					<UInputNumber
						:model-value="singleSelected.y"
						size="xs"
						class="w-20"
						@update:model-value="v => emit('setPos', 'y', v ?? singleSelected!.y)"
					/>
				</UFormField>
				<div class="w-px h-4 bg-muted" />
				<UFormField label="W" size="xs" class="flex items-center gap-1">
					<UInputNumber
						:model-value="singleSelected.width"
						:min="1"
						size="xs"
						class="w-20"
						@update:model-value="v => emit('setSize', 'width', v ?? singleSelected!.width)"
					/>
				</UFormField>
				<UFormField label="H" size="xs" class="flex items-center gap-1">
					<UInputNumber
						:model-value="singleSelected.height"
						:min="1"
						size="xs"
						class="w-20"
						@update:model-value="v => emit('setSize', 'height', v ?? singleSelected!.height)"
					/>
				</UFormField>
			</div>
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
