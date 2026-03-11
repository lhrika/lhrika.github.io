<script setup lang="ts">
// Locale to format date
const { locale } = useI18n()

// Message data
const { data: messages } = await useAsyncData('messages', () =>
	queryCollection('messages').order('created_at', 'DESC').all(),
)
</script>

<template>
	<UPageColumns>
		<UPageCard
			v-for="(message, index) in messages"
			:key="index"
			:ui="{
				root: 'bg-muted',
				body: 'text-pretty',
				footer: 'flex gap-2 ml-auto text-muted text-sm',
			}"
		>
			<template #body>
				{{ message.content }}
			</template>
			<template #footer>
				<p>{{ message.name }}</p>
				<NuxtTime :locale="locale" :datetime="message.created_at" />
			</template>
		</UPageCard>
	</UPageColumns>
</template>
