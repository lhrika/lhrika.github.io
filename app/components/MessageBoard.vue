<template>
	<UPageSection
		title="留言版"
		icon="i-lucide-notebook-pen"
		description="欢迎留言。通过审核的留言将会展示在这里"
		orientation="horizontal"
	>
		<MessageForm />
		<template #bottom>
			<UContainer>
				<MessageList />
			</UContainer>
		</template>
	</UPageSection>
</template>
