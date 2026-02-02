<template>
	<UFooter>
		<div class="flex flex-col justify-start items-center space-y-4">
			<div>────────୨ৎ────────</div>
			<div v-if="user" class="flex items-center">
				You are logged in
				<UButton
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
			<div v-else-if="route.path !== '/login'">
				<ULink
					:href="`/login?redirect=${encodeURIComponent(route.fullPath)}`"
					class="flex items-center"
				>
					<UIcon name="i-lucide-log-in" class="inline-block mr-1" />
					Log in
				</ULink>
			</div>
			<div class="text-center">
				&copy; {{ new Date().getFullYear() }} Huyễn Cảnh Lưu Ly. All rights
				reserved.
			</div>
		</div>
	</UFooter>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()
</script>
