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
	free?: boolean
}>()
</script>
<template>
	<UPageCard
		:to="to"
		class="overflow-hidden"
		:class="{
			'lg:col-span-2': !!image,
		}"
		:orientation="image ? 'horizontal' : 'vertical'"
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
		<div
			v-if="free"
			class="absolute -top-8 -right-8 lg:-left-8 rotate-45 size-16 bg-success"
		/>
		<div
			v-if="image"
			class="overflow-hidden aspect-video flex justify-center items-center"
		>
			<NuxtImg
				:src="typeof image === 'string' ? image : image.src"
				class="w-full"
			/>
		</div>
	</UPageCard>
</template>
