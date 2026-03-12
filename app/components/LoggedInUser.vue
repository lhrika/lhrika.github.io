<template>
	<div class="flex">
		<UUser
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
		<UButton
			v-if="user"
			size="sm"
			variant="ghost"
			color="neutral"
			icon="i-lucide-log-out"
			@click="
				() => {
					supabase.auth.signOut()
				}
			"
		/>
	</div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const supabaseUser = useSupabaseUser()
const mounted = ref(false)
const user = computed(() => {
	if (mounted.value) {
		return supabaseUser.value
	}
	return null
})
onMounted(() => {
	mounted.value = true
})
</script>
