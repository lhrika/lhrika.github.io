<template>
	<UPage class="px-4">
		<UPageHeader
			title="BLOG"
			:ui="{
				root: 'border-0',
				title: 'font-vintage flex items-center justify-center gap-2 mx-auto',
			}"
		>
			<template #title>
				<span class="font-sans text-xl font-light">. ⊹ ₊ ݁</span>
				BLOG
				<span class="font-sans text-xl font-light"> ₊ ⊹ . ݁</span>
			</template>
			<div class="text-center text-sm font-light">꧁──────ஓ๑♡๑ஓ──────꧂</div>
		</UPageHeader>
		<UPageBody>
			<USelect
				v-model="tags"
				:items="availableTags"
				multiple
				placeholder="Filter by tags"
				class="w-48"
				@change="
					() => {
						refreshBlog()
					}
				"
			/>
			<UBlogPosts>
				<UBlogPost
					v-for="(post, index) in posts"
					:key="index"
					v-bind="post"
					:to="post.path"
				>
					<template v-if="post.image" #header>
						<NuxtImg
							:src="post.image"
							:provider="post.image.startsWith('http') ? 'ipx' : 'google'"
							width="640"
							height="360"
							loading="lazy"
						/>
					</template>
					<template #description>
						<div v-if="post.description">
							{{ post.description }}
						</div>
						<div v-if="post.tags" class="text-sm mt-2">
							{{ post.tags?.map(tag => `#${tag}`).join(' ') }}
						</div>
					</template>
					<template v-if="post.date" #date>
						<span>{{ new Date(post.date).toLocaleDateString(locale) }}</span>
					</template>
				</UBlogPost>
			</UBlogPosts>
			<div v-if="user">
				<UPageSection
					:title="$t('privatePosts')"
					description="Limited to logged in users"
				/>
				<UBlogPosts>
					<UBlogPost
						v-for="(post, index) in privatePosts"
						:key="index"
						:title="post.title ?? 'No Title'"
						:date="new Date(post.created_at)"
						:to="`/blog/private/${post.slug}`"
					/>
				</UBlogPosts>
			</div>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
definePageMeta({
	title: 'Blog',
})

// Locale used to format date
const { locale } = useI18n()

const availableTags = ref<string[]>([])
const allPosts = await queryCollection('blog').select('tags').all()
availableTags.value = [...new Set(allPosts.flatMap(post => post.tags || []))]
const tags = ref<string[]>([])

const { data: posts, refresh: refreshBlog } = await useAsyncData(
	'blog',
	async () => {
		// fetch all blog posts then filter client-side to require ALL tags in `tags`
		const all = await queryCollection('blog').all()
		if (!tags.value.length) return all
		return (all || []).filter(p => {
			return tags.value.every(t => p.tags?.includes(t))
		})
	},
)
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { data: privatePosts, refresh } = useAsyncData(
	'private-posts',
	async () => {
		if (user.value) {
			const { data, error } = await supabase
				.from('posts')
				.select('title,slug,created_at')
			if (error) {
				console.error('Error fetching private posts:', error)
				return []
			}
			return data
		}
		return []
	},
	{ server: false },
)

onMounted(() => {
	refresh()
})
</script>
