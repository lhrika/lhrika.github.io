<template>
	<UModal
		v-model:open="open"
		title="New Update"
		:ui="{
			header: 'justify-between',
		}"
	>
		<UButton
			icon="i-lucide-plus"
			size="xl"
			class="fixed bottom-6 right-6 rounded-full z-5000"
		/>
		<template #header="{ close }">
			<UButton
				icon="i-lucide-x"
				variant="ghost"
				color="neutral"
				@click="close"
			/>
			<UButton
				icon="i-lucide-send"
				variant="ghost"
				color="primary"
				:disabled="!content"
				@click="onSubmit"
			/>
		</template>
		<template #body>
			<UTextarea v-model="content" autofocus class="w-full" />
		</template>
	</UModal>
</template>

<script lang="ts" setup>
const supabase = useSupabaseClient()
const content = ref('')
const open = ref(false)
const onSubmit = () => {
	supabase
		.from('updates')
		.insert({
			content: content.value,
		})
		.then(res => {
			if (res.status >= 200 && res.status < 300) {
				content.value = ''
				open.value = false
			}
		})
}
</script>
