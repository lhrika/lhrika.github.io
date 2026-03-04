<template>
	<UPage>
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
			<UContainer>
				<USelect
					v-model="tags"
					:items="availableTags"
					multiple
					placeholder="Filter by tags"
					class="w-48 lg:hidden"
					@change="
						() => {
							refreshPostCount()
							refreshPosts()
						}
					"
				/>
			</UContainer>
			<UContainer>
				<UBlogPosts>
					<UBlogPost
						v-for="(post, index) in posts"
						:key="index"
						v-bind="post"
						:to="post.path"
					>
						<template #header>
							<NuxtImg
								v-if="post.image"
								:src="post.image"
								:provider="post.image.startsWith('http') ? 'ipx' : 'google'"
								width="640"
								height="360"
								loading="lazy"
							/>
							<div
								v-else
								class="absolute bg-primary/40 inset-0 content-center text-center font-bold text-lg"
							>
								{{ post.title }}
							</div>
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
			</UContainer>
			<UPagination
				v-if="(postCount ?? 0) > 5"
				v-model:page="currentPage"
				:total="postCount"
				:items-per-page="5"
				:ui="{
					list: 'justify-center',
				}"
			/>

			<div v-if="user">
				<UPageSection
					:title="$t('privatePosts')"
					description="Limited to logged in users"
				/>
				<UContainer>
					<UBlogPosts>
						<UBlogPost
							v-for="(post, index) in privatePosts"
							:key="index"
							:title="post.title ?? 'No Title'"
							:date="new Date(post.created_at)"
							:to="`/blog/private/${post.slug}`"
						/>
					</UBlogPosts>
				</UContainer>
			</div>
		</UPageBody>
		<template #right>
			<UPageAside>
				<USelect
					v-model="tags"
					:items="availableTags"
					multiple
					placeholder="Filter by tags"
					class="w-48"
					@change="
						() => {
							refreshPostCount()
							refreshPosts()
						}
					"
				/>
			</UPageAside>
		</template>
	</UPage>
</template>

<script setup lang="ts">
// Locale used to format date
const { locale, t } = useI18n()

// SEO
definePageMeta({
	title: 'Blog',
})
useHead({
	title: t('blog'),
})

// Route used to get page and tags
const route = useRoute()

// Query all posts to get all tags
const allPosts = await queryCollection('blog').select('tags').all()
const availableTags = ref<string[]>([])
availableTags.value = [...new Set(allPosts.flatMap(post => post.tags || []))]

// Selected tags
const tags = ref<string[]>([])

// Current page from url query
const currentPage = computed({
	get() {
		return typeof route.query.page === 'string' ? parseInt(route.query.page) : 1
	},
	set(page: number) {
		navigateTo({
			query: { ...route.query, page },
		})
	},
})

// Refresh blog data when current page changes
watch(currentPage, () => {
	refreshPosts()
})

// Post count for pagination
const { data: postCount, refresh: refreshPostCount } = await useAsyncData(
	'post-count',
	() => {
		return queryCollection('blog')
			.andWhere(query => {
				if (!tags.value || !tags.value.length) {
					return query.where('id', 'IS NOT NULL') // No tags selected, return all posts
				}
				return tags.value.reduce((acc, cur) => {
					return acc.where('tags', 'LIKE', `%${cur}%`)
				}, query)
			})
			.count()
	},
)

// Filtered blog data
const { data: posts, refresh: refreshPosts } = await useAsyncData(
	'blog',
	() => {
		return queryCollection('blog')
			.andWhere(query => {
				if (!tags.value || !tags.value.length) {
					return query.where('id', 'IS NOT NULL') // No tags selected, return all posts
				}
				return tags.value.reduce((acc, cur) => {
					return acc.where('tags', 'LIKE', `%${cur}%`)
				}, query)
			})
			.order('date', 'DESC')
			.skip((currentPage.value - 1) * 5)
			.limit(5)
			.all()
	},
)

// Display private posts only to authorized users
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const { data: privatePosts } = useAsyncData(
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
	// refresh()
})
</script>
