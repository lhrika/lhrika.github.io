<template>
	<UUser
		:name="user?.profile?.name ?? $t('login')"
		:avatar="{
			src: user?.profile?.avatar,
			icon: 'i-lucide-user',
		}"
		:to="user ? '/profile' : '/login'"
		:ui="{
			name: 'inline-flex items-center gap-2',
		}"
	>
		<template #name>
			{{ user?.profile?.name ?? $t('login') }}
			<UIcon v-if="!user" name="i-lucide-log-in" class="size-4" />
		</template>
	</UUser>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
</script>
