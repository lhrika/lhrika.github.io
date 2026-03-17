<template>
	<NuxtImg
		v-slot="{ src: innerSrc, isLoaded, imgAttrs }"
		:src="src"
		:provider="src.startsWith('http') || src.startsWith('/') ? 'ipx' : 'google'"
		width="300"
		:custom="true"
	>
		<img
			v-if="isLoaded"
			ref="img"
			v-bind="imgAttrs"
			:src="innerSrc"
			loading="lazy"
			class="w-75 max-w-full"
		/>
		<USkeleton v-if="!isRendered" class="w-75 h-100 aspect-3/4 max-w-full" />
	</NuxtImg>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'

const { src } = defineProps<{
	src: string
}>()

const isRendered = ref(false)
const imgRef = useTemplateRef('img')
const imgSize = useElementSize(imgRef)

watch(imgSize.height, (value, oldValue) => {
	if (value > oldValue) {
		isRendered.value = true
		imgSize.stop()
	}
})
</script>
