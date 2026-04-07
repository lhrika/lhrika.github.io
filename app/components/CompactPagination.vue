<script lang="ts" setup>
const page = defineModel<number>({
	required: true,
})
const { total, size = 'md' } = defineProps<{
	total: number
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>()
const inputRef = useTemplateRef('input')
const open = ref(false)
const onClickPage = () => {
	open.value = true
	nextTick(() => {
		inputRef.value?.inputRef.focus()
	})
}
const onBlur = () => {
	open.value = false
}
const onKeydown = (e: KeyboardEvent) => {
	if (e.code === 'Enter') {
		nextTick(() => {
			inputRef.value?.inputRef.blur()
		})
	}
}
const hasNext = computed(() => page.value < total)
const next = () => {
	if (hasNext.value) {
		page.value += 1
	}
}
const hasPrev = computed(() => page.value > 1)
const prev = () => {
	if (hasPrev.value) {
		page.value -= 1
	}
}
</script>
<template>
	<UFieldGroup>
		<UButton
			icon="i-lucide-chevron-left"
			color="neutral"
			variant="outline"
			:size="size"
			:disabled="!hasPrev"
			@click="prev"
		/>
		<UInputNumber
			v-if="open"
			ref="input"
			v-model="page"
			color="neutral"
			variant="outline"
			:size="size"
			:max="total"
			:min="1"
			class="focus-visible:bg-default w-24"
			@keydown="onKeydown"
			@blur="onBlur"
		/>
		<UButton
			v-else
			:label="`${page} / ${total}`"
			color="neutral"
			variant="outline"
			:size="size"
			@click="onClickPage"
		/>
		<UButton
			icon="i-lucide-chevron-right"
			color="neutral"
			variant="outline"
			:size="size"
			:disabled="!hasNext"
			@click="next"
		/>
	</UFieldGroup>
</template>
