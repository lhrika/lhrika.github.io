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
						</template>
					</UModal>
				</UPageGrid>
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { createReusableTemplate } from '@vueuse/core'

const route = useRoute()

const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{
	image: string | string[]
}>()

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

const { data: libraryData } = useAsyncData(
	route.path,
	() => {
		const query = queryCollection('library')
		if (typeof route.params.slug === 'object') {
			query.where('stem', 'LIKE', `library/${route.params.slug.join('/')}%`)
		}
		return query.all()
	},
	{
		watch: [() => route.params.slug],
	},
)
</script>
