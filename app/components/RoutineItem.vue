<script setup lang="ts">
import type { RoutineStatus } from '~/types/routine'
const {
	index,
	description = '',
	status = 'todo',
} = defineProps<{
	index: number
	title: string
	description?: string
	status?: RoutineStatus
}>()
const emit = defineEmits<{
	check: [index: number]
	uncheck: [index: number]
	disable: [index: number]
	enable: [index: number]
}>()
const statusColors = {
	todo: 'primary',
	done: 'success',
	disabled: 'neutral',
} as const
const onCardClick = () => {
	if (status === 'done') {
		emit('uncheck', index)
	} else if (status === 'todo') {
		emit('check', index)
	}
}
const onDisableButtonClick = () => {
	if (status === 'disabled') {
		emit('enable', index)
	} else {
		emit('disable', index)
	}
}
</script>
<template>
	<div
		class="routine-item"
		:class="{
			'routine-item--todo': status === 'todo',
			'routine-item--done': status === 'done',
			'routine-item--disabled': status === 'disabled',
		}"
		@click.stop="onCardClick"
	>
		<div class="flex justify-between items-center">
			<p class="font-bold">{{ title }}</p>
			<UButton
				variant="ghost"
				size="sm"
				:color="statusColors[status]"
				:label="status === 'disabled' ? 'Enable' : 'Skip'"
				:class="{
					'text-muted': status === 'disabled',
				}"
				@click.stop="onDisableButtonClick"
			/>
		</div>
		<p v-if="description" class="text-sm">{{ description }}</p>
	</div>
</template>
<style scoped>
@reference '~/assets/css/main.css';
.routine-item {
	@apply bg-primary/10 border border-primary rounded-sm p-4 flex flex-col gap-2;
}
.routine-item--done {
	@apply bg-success/10 border-success;
}
.routine-item--disabled {
	@apply bg-muted border-muted text-muted;
}
</style>
