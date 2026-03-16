<template>
	<UPage>
		<UContainer>
			<UNavigationMenu :items="navigationMenuItems" highlight />
			<UPageHeader title="Library" />
		</UContainer>
		<UPageBody>
			<UContainer>
				<UPageGrid>
					<div
						v-for="libraryItem in libraryData"
						:key="libraryItem.id"
						class="flex flex-col items-center"
					>
						<UCarousel
							v-slot="{ item }"
							:items="
								typeof libraryItem.image === 'string'
									? [libraryItem.image]
									: libraryItem.image
							"
							class="aspect-3/4 w-75 max-w-full mx-auto bg-muted"
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
						<div>{{ libraryItem.title }}</div>
					</div>
				</UPageGrid>
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

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
