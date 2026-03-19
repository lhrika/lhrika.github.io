<template>
	<UPage>
		<UContainer>
			<UPageHeader title="Library" />
			<UNavigationMenu :items="navigationMenuItems" highlight />
			<div>
				<USelect
					v-model="selectedStatus"
					:items="statusSelectItems"
					value-key="value"
					multiple
					class="w-48"
				/>
			</div>
		</UContainer>
		<UPageBody>
			<UContainer>
				<UPageGrid>
					<DefineTemplate v-slot="{ image }">
						<LibraryImage v-if="typeof image === 'string'" :src="image" />
						<UCarousel
							v-else
							v-slot="{ item }"
							:items="image"
							class="w-75 max-w-full bg-muted"
							:ui="{
								root: 'flex flex-col justify-center',
							}"
						>
							<LibraryImage :src="item" />
						</UCarousel>
					</DefineTemplate>
					<UModal
						v-for="libraryItem in libraryData"
						:key="libraryItem.id"
						:title="libraryItem.title"
					>
						<div
							class="relative flex flex-col items-center cursor-pointer w-75 max-w-full"
						>
							<UBadge
								:label="
									$t(`${i18nPrefix}status.${libraryItem.status ?? 'ongoing'}`)
								"
								:color="statusColor[libraryItem.status]"
								class="absolute top-2 left-2"
							/>
							<ReuseTemplate :image="libraryItem.image" />
							<div class="px-4">{{ libraryItem.title }}</div>
						</div>
						<template #body>
							<ReuseTemplate :image="libraryItem.image" />
							<p v-if="libraryItem.startDate || libraryItem.completeDate">
								<NuxtTime
									v-if="libraryItem.startDate"
									:datetime="libraryItem.startDate"
									:locale="locale"
								/>
								~
								<NuxtTime
									v-if="libraryItem.completeDate"
									:datetime="libraryItem.completeDate"
									:locale="locale"
								/>
							</p>
						</template>
					</UModal>
					<div ref="list-bottom" class="absolute bottom-0" />
				</UPageGrid>
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
import type { NavigationMenuItem, SelectItem } from '@nuxt/ui'
import { createReusableTemplate, useElementVisibility } from '@vueuse/core'

// Set page meta
definePageMeta({
	title: 'Library',
})

const route = useRoute()

const i18nPrefix = computed(() => {
	if (!route.params.slug) {
		return 'page.library.common.'
	}
	if (typeof route.params.slug === 'string') {
		return `page.library.${route.params.slug}.`
	} else {
		return `page.library.${route.params.slug.join('.')}.`
	}
})

// Locale to format date
const { locale } = useI18n()

const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{
	image: string | string[]
}>({
	inheritAttrs: false,
})

// Color for status
type Status = 'ongoing' | 'completed' | 'pending' | 'interested'
type Color = 'primary' | 'secondary' | 'success' | 'info' | 'neutral'
const statusColor: Record<Status, Color> = {
	ongoing: 'primary',
	completed: 'success',
	pending: 'secondary',
	interested: 'info',
}

// Status select items
const statusSelectItems = ref([
	{
		label: $t(`${i18nPrefix.value}status.pending`),
		value: 'pending',
		chip: {
			color: statusColor['pending'],
		},
	},
	{
		label: $t(`${i18nPrefix.value}status.ongoing`),
		value: 'ongoing',
		chip: {
			color: statusColor['ongoing'],
		},
	},
	{
		label: $t(`${i18nPrefix.value}status.completed`),
		value: 'completed',
		chip: {
			color: statusColor['completed'],
		},
	},
	{
		label: $t(`${i18nPrefix.value}status.interested`),
		value: 'interested',
		chip: {
			color: statusColor['interested'],
		},
	},
] satisfies SelectItem[])
// Status select value
const selectedStatus = ref<string[]>([])

// Max list items count
const limit = ref(3)

// Whether the bottom of the list is visible
const bottomRef = useTemplateRef('list-bottom')
const bottomIsVisible = useElementVisibility(bottomRef)

const navigationMenuItems: NavigationMenuItem[] = [
	{
		label: $t('page.library.common.navigation.all'),
		to: '/library',
	},
	{
		label: $t('page.library.common.navigation.anime'),
		to: '/library/anime',
	},
	{
		label: $t('page.library.common.navigation.game'),
		to: '/library/game',
	},
	{
		label: $t('page.library.common.navigation.book'),
		to: '/library/book',
	},
]

const { data: libraryData, status: loadStatus } = useAsyncData(
	route.path,
	() => {
		const query = queryCollection('library')
		if (typeof route.params.slug === 'object') {
			query.where('stem', 'LIKE', `library/${route.params.slug.join('/')}%`)
		}
		if (selectedStatus.value.length > 0) {
			query.orWhere(q =>
				selectedStatus.value.reduce((acc, cur) => {
					return acc.where('status', '=', cur)
				}, q),
			)
		}
		return query.limit(limit.value).all()
	},
	{
		watch: [limit, selectedStatus],
		transform: data => {
			if (import.meta.dev) {
				data.forEach(item => {
					if (typeof item.image === 'string') {
						item.image = 'https://dummyimage.com/300x400/000/fff'
					} else {
						item.image = Array(item.image.length).fill(
							'https://dummyimage.com/300x400/000/fff',
						)
					}
				})
			}
			return data
		},
	},
)

watchEffect(() => {
	if (
		loadStatus.value === 'success' &&
		bottomIsVisible.value &&
		libraryData.value &&
		libraryData.value.length === limit.value
	) {
		limit.value += 3
	}
})
</script>
