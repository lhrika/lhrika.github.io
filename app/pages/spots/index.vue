<script setup lang="ts">
definePageMeta({
	i18n: {
		locales: ['ja'],
	},
})

const { locale, setLocale } = useI18n()
if (locale.value !== 'ja') {
	setLocale('ja')
}

// Free-text search
const searchQuery = ref('')

const { data: spots, refresh } = useAsyncData('spots-list', () => {
	return queryCollection('spots')
		.where('rawBody', 'LIKE', `%${searchQuery.value}%`)
		.all()
})

watch(searchQuery, () => {
	refresh()
})

watch(
	spots,
	value => {
		console.log(value)
	},
	{
		immediate: true,
	},
)
</script>
<template>
	<UPage>
		<UPageHeader title="観光・散策スポットまとめ" />
		<UPageBody>
			<UContainer>
				<UInput v-model="searchQuery" />
			</UContainer>
			<UContainer>
				<UPageGrid>
					<SpotCard
						v-for="spot in spots"
						:key="spot.name"
						:name="spot.name"
						:description="spot.description"
						:to="`/${spot.stem}`"
						:image="spot.image"
					/>
				</UPageGrid>
			</UContainer>
		</UPageBody>
	</UPage>
</template>
