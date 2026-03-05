<template>
	<div class="py-4 pl-4 pr-8">
		<div class="relative bg-muted rounded-lg py-2 px-4">
			<UAvatar
				:src="profile?.avatar"
				icon="i-lucide-user"
				class="absolute -bottom-4 -right-4"
			/>
			<div
				class="absolute -bottom-4 right-6 text-sm text-muted bg-default py-1 px-2 border-y border-muted"
			>
				{{ date.toLocaleString(locale) }}
			</div>
			{{ content }}
		</div>
	</div>
</template>
<script setup lang="ts">
const props = defineProps<{
	content: string
	at: string | Date | number
	user: string
}>()

// Locale to format date
const { locale } = useI18n()

const date = computed(() => {
	if (!props.at) return ''
	return new Date(props.at)
})

const { data: profile } = await useProfile(props.user)
</script>
