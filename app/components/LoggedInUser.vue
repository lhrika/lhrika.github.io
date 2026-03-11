<template>
	<ClientOnly>
		<UUser
			:name="user?.profile?.name ?? $t('login')"
			:avatar="{
				src: user?.profile?.avatar,
				icon: 'i-lucide-user',
			}"
			:to="user ? '/profile' : '/login'"
			:ui="{
				name: 'inline-flex items-center gap-2 flex-nowrap text-nowrap',
			}"
		>
			<template #name>
				{{ user?.profile?.name ?? $t('login') }}
				<UIcon v-if="!user" name="i-lucide-log-in" class="size-4" />
			</template>
		</UUser>
		<template #fallback>
			<ULink to="/login">Login</ULink>
		</template>
	</ClientOnly>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
</script>
