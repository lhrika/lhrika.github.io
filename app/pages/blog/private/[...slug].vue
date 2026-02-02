<script setup lang="ts">
definePageMeta({
	title: 'Blog',
})
const route = useRoute()
const slug =
	typeof route.params.slug === 'string'
		? route.params.slug
		: (route.params.slug ?? []).join('/')
const supabase = useSupabaseClient()
const user = useSupabaseUser()
if (!user.value) {
	navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
}
const { data: post } = await useAsyncData(`post-${slug}`, async () => {
	const { data, error } = await supabase
		.from('posts')
		.select('*')
		.eq('slug', slug)
		.single()
	if (error) return undefined
	return data
})
if (!post.value) {
	throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const editModalOpen = ref(false)
const state = reactive({
	content: '',
})
const onModalOpen = (open: boolean) => {
	if (open) {
		state.content = post.value!.content ?? ''
	}
}
const toast = useToast()
const updatePost = async () => {
	const { error } = await supabase
		.from('posts')
		.update({ content: state.content })
		.eq('slug', slug)
	if (error) {
		toast.add({
			title: 'Error',
			description: 'Failed to update post',
			color: 'error',
		})
	} else {
		toast.add({
			title: 'Success',
			description: 'Post updated successfully',
			color: 'success',
		})
	}
	refreshNuxtData(`post-${slug}`)
	editModalOpen.value = false
}
</script>

<template>
	<UPage>
		<UPageBody>
			<MDC :value="post!.content!" class="px-4 max-w-3xl mx-auto" />
			<div class="px-4 max-w-3xl mx-auto flex justify-end">
				<UModal v-model:open="editModalOpen" @update:open="onModalOpen">
					<UButton label="Edit" color="neutral" variant="subtle" />
					<template #content>
						<UForm class="p-4 space-y-4" :state="state" @submit="updatePost">
							<UFormField label="Post Content" name="content">
								<UTextarea v-model="state.content" class="w-full" />
							</UFormField>
							<UButton type="submit"> Update Post </UButton>
						</UForm>
					</template>
				</UModal>
			</div>
		</UPageBody>
	</UPage>
</template>
