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
	address: string
	to: string
	image?: Image
}>()
</script>
<template>
	<UPageCard
		:to="to"
		:class="{
			'lg:col-span-2': !!image,
		}"
		orientation="horizontal"
		spotlight
		spotlight-color="primary"
	>
		<template #body>
			<div class="mb-2">
				<div class="text-pretty font-bold text-base lg:text-lg">{{ name }}</div>
				<div
					v-if="address"
					class="text-nowrap text-ellipsis overflow-hidden text-sm text-muted"
				>
					{{ address }}
				</div>
			</div>
			<div class="line-clamp-3 text-sm lg:text-base">{{ description }}</div>
		</template>
		<div class="overflow-hidden aspect-video flex justify-center items-center">
			<NuxtImg
				v-if="image"
				:src="typeof image === 'string' ? image : image.src"
				class="w-full"
			/>
		</div>
	</UPageCard>
</template>
