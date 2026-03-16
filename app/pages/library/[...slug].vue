<template>
	<UPage>
		<UContainer>
			<UPageHeader title="Library" />
		</UContainer>
		<UPageBody>
			<UContainer class="grid sm:grid-cols-2 lg:grid-cols-3">
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
						class="aspect-3/4 w-75 mx-auto bg-muted"
						:ui="{
							root: 'flex flex-col justify-center',
						}"
					>
						<NuxtImg
							:src="item"
							class="w-75 h-auto"
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
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
const { data: libraryData } = useAsyncData('library', () =>
	queryCollection('library').all(),
)
</script>
