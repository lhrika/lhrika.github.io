<script setup lang="ts">
type Image =
	| string
	| {
			src: string
			alt?: string
			width?: number
			height?: number
	  }
defineProps<{
	name: string
	description: string
	to: string
	image?: Image
}>()
</script>
<template>
	<UPageCard
		:title="name"
		:description="description"
		:to="to"
		:ui="{
			description: 'line-clamp-4',
		}"
		:class="{
			'lg:col-span-2': !!image,
		}"
		orientation="horizontal"
	>
		<NuxtImg
			v-if="image"
			:src="typeof image === 'string' ? image : image.src"
			class="w-full"
		/>
	</UPageCard>
</template>
