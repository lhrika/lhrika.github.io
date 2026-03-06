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
			<UContainer class="lg:hidden space-x-2 space-y-2">
				<USelect
					v-model="tags"
					:items="tagSelectItems"
					multiple
					placeholder="Filter by tags"
					class="w-48"
				/>
				<UInputDate ref="inputDate" v-model="dateRange" :locale="locale" range>
					<template #trailing>
						<UPopover :reference="inputDate?.inputsRef[0]?.$el">
							<UButton
								color="neutral"
								variant="link"
								size="sm"
								icon="i-lucide-calendar"
								aria-label="Select a date range"
								class="px-0"
							/>
							<template #content>
								<UCalendar
									v-model="dateRange"
									class="p-2"
									range
									:locale="locale"
								/>
							</template>
						</UPopover>
					</template>
				</UInputDate>
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
							<NuxtTime
								:datetime="post.date"
								year="numeric"
								month="short"
								day="numeric"
								:locale="locale"
							/>
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
				<UCalendar
					v-model="dateRange"
					:locale="locale"
					range
					size="xs"
					class="mb-6"
				/>

				<USelect
					v-model="tags"
					:items="tagSelectItems"
					multiple
					placeholder="Filter by tags"
					class="w-full mb-4"
				/>
				<UScrollArea class="max-h-64">
					<UCheckboxGroup v-model="tags" :items="tagCheckboxGroupItems" />
				</UScrollArea>
			</UPageAside>
		</template>
	</UPage>
</template>

<script setup lang="ts">
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
// Locale used to format date
const { locale, t } = useI18n()

// Ref for date input to anchor popover
const inputDate = useTemplateRef('inputDate')

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
const availableTags: Record<string, number> = allPosts.reduce(
	(acc, post) => {
		if (post.tags) {
			post.tags.forEach((tag: string) => {
				acc[tag] = (acc[tag] || 0) + 1
			})
		}
		return acc
	},
	{} as Record<string, number>,
)
const tagCheckboxGroupItems = computed(() =>
	Object.entries(availableTags).map(([tag, count]) => ({
		label: `${tag} (${count})`,
		value: tag,
	})),
)
const tagSelectItems = computed(() =>
	Object.entries(availableTags).map(([tag]) => tag),
)

// Selected tags
const tags = computed({
	get() {
		const queryTags = route.query.tags
		if (typeof queryTags === 'string') {
			return [queryTags]
		} else if (Array.isArray(queryTags)) {
			return queryTags as string[]
		}
		return [] as string[]
	},
	set(newTags: string[]) {
		navigateTo({
			query: { ...route.query, tags: newTags },
		})
	},
})

// Refresh blog data when tags change
watch(tags, () => {
	refreshPostCount()
	refreshPosts()
})

// Date range for calendar
const dateRange = shallowRef<{
	start: CalendarDate
	end: CalendarDate
}>()
watch(dateRange, () => {
	refreshPostCount()
	refreshPosts()
})

// Current page from url query
const currentPage = computed({
	get() {
		return typeof route.query.page === 'string' ? parseInt(route.query.page) : 1
	},
	set(page: number) {
		if (page === 1) {
			const { page: _, ...query } = route.query
			navigateTo({ query })
		} else {
			navigateTo({
				query: { ...route.query, page },
			})
		}
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
			.andWhere(query => {
				if (!dateRange.value) {
					return query.where('id', 'IS NOT NULL') // No date range selected, return all posts
				}
				const endDate = dateRange.value.end.add({ days: 1 }).toString()
				return query
					.where('date', '>=', dateRange.value.start.toString())
					.where('date', '<', endDate)
			})
			.count()
	},
)

// Reset to first page when post count changes
watch(postCount, () => {
	currentPage.value = 1
})

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
			.andWhere(query => {
				if (!dateRange.value) {
					return query.where('id', 'IS NOT NULL') // No date range selected, return all posts
				}
				const endDate = dateRange.value.end.add({ days: 1 }).toString()
				return query
					.where('date', '>=', dateRange.value.start.toString())
					.where('date', '<', endDate)
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
