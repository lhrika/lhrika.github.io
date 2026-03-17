<template>
	<NuxtImg
		v-slot="{ src: innerSrc, isLoaded, imgAttrs }"
		:src="src"
		class="w-75 max-w-full"
		:provider="src.startsWith('http') || src.startsWith('/') ? 'ipx' : 'google'"
		width="300"
		loading="lazy"
		:custom="true"
		@load="
			() => {
				nextTick(() => {
					isRendered = true
				})
			}
		"
	>
		<img
			v-if="isLoaded"
			v-bind="imgAttrs"
			:src="innerSrc"
			:class="{
				hidden: !isRendered,
			}"
		/>
		<USkeleton v-else class="w-75 h-100" />
	</NuxtImg>
</template>
<script setup lang="ts">
const { src } = defineProps<{
	src: string
}>()
const isRendered = ref(false)
</script>
