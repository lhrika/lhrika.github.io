<template>
	<UPage>
		<UContainer>
			<UNavigationMenu :items="navigationMenuItems" highlight />
			<UPageHeader title="Library" />
		</UContainer>
		<UPageBody>
			<UContainer>
				<UPageGrid>
					<DefineTemplate v-slot="{ image }">
						<NuxtImg
							v-if="typeof image === 'string'"
							:src="image"
							class="w-75 h-auto max-w-full"
							:provider="
								image.startsWith('http') || image.startsWith('/')
									? 'ipx'
									: 'google'
							"
							width="300"
							loading="lazy"
							:placeholder="[300, 400]"
						/>
						<UCarousel
							v-else
							v-slot="{ item }"
							:items="image"
							class="w-75 max-w-full bg-muted"
							:ui="{
								root: 'flex flex-col justify-center',
							}"
						>
							<NuxtImg
								:src="item"
								class="w-75 h-auto max-w-full"
								:provider="
									item.startsWith('http') || item.startsWith('/')
										? 'ipx'
										: 'google'
								"
								width="300"
								loading="lazy"
								:placeholder="[300, 400]"
							/>
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
									$t(
										`library.${libraryItem.stem.split('/').at(1)}.status.${libraryItem.status ?? 'ongoing'}`,
									)
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
import type { NavigationMenuItem } from '@nuxt/ui'
import { createReusableTemplate, useElementVisibility } from '@vueuse/core'

// Set page meta
definePageMeta({
	title: 'Library',
})

const route = useRoute()

// Locale to format date
const { locale } = useI18n()

const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{
	image: string | string[]
}>()

// Max list items count
const limit = ref(3)

// Whether the bottom of the list is visible
const bottomRef = useTemplateRef('list-bottom')
const bottomIsVisible = useElementVisibility(bottomRef)

const navigationMenuItems: NavigationMenuItem[] = [
	{
		label: 'All',
		to: '/library',
	},
	{
		label: 'Anime',
		to: '/library/anime',
	},
	{
		label: 'Game',
		to: '/library/game',
	},
	{
		label: 'Book',
		to: '/library/book',
	},
]

// Color for status
type Status = 'ongoing' | 'completed' | 'pending' | 'interested'
type Color = 'primary' | 'secondary' | 'success' | 'info' | 'neutral'
const statusColor: Record<Status, Color> = {
	ongoing: 'primary',
	completed: 'success',
	pending: 'secondary',
	interested: 'info',
}

const { data: libraryData, status: loadStatus } = useAsyncData(
	route.path,
	() => {
		const query = queryCollection('library')
		if (typeof route.params.slug === 'object') {
			query.where('stem', 'LIKE', `library/${route.params.slug.join('/')}%`)
		}
		return query.limit(limit.value).all()
	},
	{
		watch: [limit],
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
		console.log(limit.value)
	}
})
</script>
