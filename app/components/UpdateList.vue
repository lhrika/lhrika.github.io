<template>
	<UContainer>
		<div class="space-y-4">
			<UpdateItem
				v-for="(update, index) in updates"
				:key="index"
				:content="update.content"
				:at="update.at"
				:avatar="update.avatar"
			/>
		</div>
	</UContainer>
</template>
<script setup lang="ts">
const { data: updates } = await useAsyncData(
	'updates',
	() => queryCollection('updates').all(),
	{
		transform: data => {
			if (!data) return []
			return data.flatMap(file => file.items)
		},
	},
)
</script>
