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
			<!-- <MessageBoard /> -->
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
							{{ new Date(message.created_at).toLocaleString(locale) }}
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
const { locale } = useI18n()
const { data: messages } = await useAsyncData('messages', () =>
	queryCollection('messages').order('created_at', 'DESC').all(),
)
</script>
