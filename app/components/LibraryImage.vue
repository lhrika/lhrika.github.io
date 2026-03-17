<template>
	<NuxtImg
		v-slot="{ src: innerSrc, isLoaded, imgAttrs }"
		:src="src"
		class="w-75 max-w-full"
		:provider="src.startsWith('http') || src.startsWith('/') ? 'ipx' : 'google'"
		width="300"
		loading="lazy"
		:custom="true"
	>
		<img v-if="isLoaded" ref="img" v-bind="imgAttrs" :src="innerSrc" />
		<USkeleton v-if="!isRendered" class="w-75 h-100" />
	</NuxtImg>
</template>
<script setup lang="ts">
const { src } = defineProps<{
	src: string
}>()
const imgRef = useTemplateRef('img')
const isRendered = ref(false)
watchEffect(() => {
	if (!isRendered.value && imgRef.value && imgRef.value.scrollHeight > 10) {
		console.log(imgRef.value, imgRef.value.scrollHeight)
		isRendered.value = true
	}
})
</script>
