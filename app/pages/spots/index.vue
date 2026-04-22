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
const keywords = shallowRef([] as string[])
const ignorePattern = /^[\\":{}\s\n\t,a-zA-Z]+$/i
const search = () => {
	keywords.value = searchQuery.value
		.split(/\s+/)
		.filter(s => ignorePattern.exec(s) === null)
}
const onKeydown = (e: KeyboardEvent) => {
	if (e.code === 'Enter') {
		search()
	}
}

const { data: spots } = useAsyncData(
	'spots-list',
	() => {
		const query = queryCollection('spots')
		if (keywords.value.length) {
			query.andWhere(q => {
				return keywords.value.reduce((q, keyword) => {
					return q.where('rawBody', 'LIKE', `%${keyword}%`)
				}, q)
			})
		}
		return query.all()
	},
	{
		watch: [keywords],
	},
)

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
				<UInput
					v-model.trim="searchQuery"
					icon="i-lucide-search"
					class="w-full max-w-96"
					@blur="search"
					@keydown="onKeydown"
				/>
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
