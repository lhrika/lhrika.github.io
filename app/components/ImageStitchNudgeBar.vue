<template>
	<div class="flex items-center gap-4 text-sm">
		<!-- Nudge buttons -->
		<div class="flex items-center gap-1">
			<UFieldGroup size="xs">
				<UTooltip text="上移 (↑)">
					<UButton
						icon="i-lucide-arrow-up"
						color="neutral"
						variant="subtle"
						@click="emit('nudge', 0, -1)"
					/>
				</UTooltip>
				<UTooltip text="下移 (↓)">
					<UButton
						icon="i-lucide-arrow-down"
						color="neutral"
						variant="subtle"
						@click="emit('nudge', 0, 1)"
					/>
				</UTooltip>
				<UTooltip text="左移 (←)">
					<UButton
						icon="i-lucide-arrow-left"
						color="neutral"
						variant="subtle"
						@click="emit('nudge', -1, 0)"
					/>
				</UTooltip>
				<UTooltip text="右移 (→)">
					<UButton
						icon="i-lucide-arrow-right"
						color="neutral"
						variant="subtle"
						@click="emit('nudge', 1, 0)"
					/>
				</UTooltip>
			</UFieldGroup>
		</div>

		<!-- Position & size inputs (single selection only) -->
		<template v-if="singleSelected">
			<div class="flex items-center gap-2">
				<UFormField label="X" size="xs" orientation="horizontal">
					<UInputNumber
						:model-value="singleSelected.x"
						size="xs"
						class="w-28"
						@update:model-value="
							v => emit('setPos', 'x', v ?? singleSelected!.x)
						"
					/>
				</UFormField>
				<UFormField label="Y" size="xs" orientation="horizontal">
					<UInputNumber
						:model-value="singleSelected.y"
						size="xs"
						class="w-28"
						@update:model-value="
							v => emit('setPos', 'y', v ?? singleSelected!.y)
						"
					/>
				</UFormField>
				<div class="w-px h-4 bg-muted" />
				<UFormField label="W" size="xs" orientation="horizontal">
					<UInputNumber
						:model-value="singleSelected.width"
						:min="1"
						size="xs"
						class="w-28"
						@update:model-value="v => onWidth(v ?? singleSelected!.width)"
					/>
				</UFormField>
				<UTooltip :text="sizeLocked ? '解锁比例' : '锁定比例'">
					<UButton
						:icon="sizeLocked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
						color="neutral"
						variant="ghost"
						size="xs"
						@click="sizeLocked = !sizeLocked"
					/>
				</UTooltip>
				<UFormField label="H" size="xs" orientation="horizontal">
					<UInputNumber
						:model-value="singleSelected.height"
						:min="1"
						size="xs"
						class="w-28"
						@update:model-value="v => onHeight(v ?? singleSelected!.height)"
					/>
				</UFormField>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import type { StitchImage } from '~/composables/useImageStitch'

const props = defineProps<{
	singleSelected: StitchImage | undefined
}>()

const emit = defineEmits<{
	nudge: [dx: number, dy: number]
	setPos: [axis: 'x' | 'y', value: number]
	setSize: [dim: 'width' | 'height', value: number]
}>()

const sizeLocked = ref(false)

function onWidth(v: number) {
	if (
		sizeLocked.value &&
		props.singleSelected &&
		props.singleSelected.width > 0
	) {
		emit(
			'setSize',
			'height',
			Math.max(
				1,
				Math.round(
					(v * props.singleSelected.height) / props.singleSelected.width,
				),
			),
		)
	}
	emit('setSize', 'width', v)
}

function onHeight(v: number) {
	if (
		sizeLocked.value &&
		props.singleSelected &&
		props.singleSelected.height > 0
	) {
		emit(
			'setSize',
			'width',
			Math.max(
				1,
				Math.round(
					(v * props.singleSelected.width) / props.singleSelected.height,
				),
			),
		)
	}
	emit('setSize', 'height', v)
}
</script>
