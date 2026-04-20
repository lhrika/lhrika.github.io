<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'
const model = defineModel<string>({
	required: true,
})
const { items } = defineProps<{
	items: RadioGroupItem[]
}>()
</script>
<template>
	<div class="overflow-x-auto">
		<URadioGroup
			v-model="model"
			orientation="horizontal"
			variant="card"
			:items
			value-key="value"
			indicator="hidden"
			size="sm"
			:ui="{
				item: 'text-nowrap rounded-full py-1.5 px-3',
			}"
		/>
	</div>
</template>
