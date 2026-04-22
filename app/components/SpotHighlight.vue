<script setup lang="ts">
defineProps<{
	name: string
	description?: string
	time: string
}>()
</script>
<template>
	<UPageFeature
		:title="`${name}（${time}）`"
		:description="description"
		icon="i-lucide-flower"
	/>
</template>
