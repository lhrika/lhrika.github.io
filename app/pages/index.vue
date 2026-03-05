<template>
	<UPage>
		<UPageBody>
			<!-- <OtmfcGallery /> -->
			<UPageSection
				title="动态"
				description="喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵喵"
			/>
			<UpdateList />
			<UpdateModal v-if="user" />
			<UPageSection
				title="留言版"
				description="欢迎留言。通过审核的留言将会展示在这里"
			/>
			<MessageBoard />
			<UContainer class="space-y-4">
				<UCard
					v-for="(message, index) in messages"
					:key="index"
					variant="soft"
					:ui="{
						root: 'bg-default divide-none p-4',
						header: 'flex justify-between items-center p-0 sm:p-0',
						body: 'p-0 sm:p-0',
					}"
				>
					<template #header>
						<div class="font-bold">
							{{ message.name }}
						</div>
						<div class="text-sm text-muted">
							{{ new Date(message.date).toLocaleString() }}
						</div>
					</template>
					<div>
						{{ message.content }}
					</div>
				</UCard>
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const { data: messagesData } = await useAsyncData('messages', () =>
	queryCollection('messages').all(),
)
const messages = computed(() => {
	if (!messagesData.value) return []
	const items = messagesData.value.flatMap(item => item.messages)
	return items.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	)
})
</script>
