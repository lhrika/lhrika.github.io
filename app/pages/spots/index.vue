<script setup lang="ts">
definePageMeta({
	title: '観光・散策スポットまとめ',
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
const compositioning = ref(false)
const ignorePattern = /^[\\":{}\s\n\t,a-zA-Z]+$/i
const search = () => {
	keywords.value = searchQuery.value
		.split(/\s+/)
		.filter(s => ignorePattern.exec(s) === null)
}
const onKeydown = (e: KeyboardEvent) => {
	if (!compositioning.value && e.code === 'Enter') {
		search()
	}
}

// Other condition filters
const freeParking = ref(false)
const freeEntrance = ref(false)

const { data: spots } = useAsyncData(
	'spots-list',
	() => {
		const query = queryCollection('spots')
		if (keywords.value.length) {
			query.andWhere(q => {
				return keywords.value.reduce((q, keyword) => {
					return q.where('rawbody', 'LIKE', `%${keyword}%`)
				}, q)
			})
		}
		if (freeEntrance.value) {
			query.where('fee', '=', 0)
		}
		if (freeParking.value) {
			query.orWhere(q => {
				return q.where('parking', '=', 'true').where('parking', '=', '無料')
			})
		}
		return query.all()
	},
	{
		watch: [keywords, freeEntrance, freeParking],
		// In static generation (GitHub Pages), nuxtApp.static.data persists across refreshes.
		// The default getCachedData returns static.data[key] after hydration, which causes
		// watch-triggered re-executions to return the pre-rendered (unfiltered) data instead
		// of making a fresh query. Override to only cache during the initial hydration.
		getCachedData: (key, nuxtApp, ctx) => {
			if (nuxtApp.isHydrating) {
				return nuxtApp.payload.data[key]
			}
			if (ctx.cause === 'watch') {
				return undefined
			}
			return nuxtApp.static.data[key]
		},
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
			<UContainer class="flex flex-col gap-4 lg:flex-row">
				<UInput
					v-model.trim="searchQuery"
					icon="i-lucide-search"
					class="w-full max-w-96"
					placeholder="キーワードで検索"
					@blur="search"
					@keydown="onKeydown"
					@compositionstart="
						() => {
							compositioning = true
						}
					"
					@compositionend="
						() => {
							compositioning = false
						}
					"
				>
					<template v-if="searchQuery.length" #trailing>
						<UButton
							color="neutral"
							variant="link"
							size="sm"
							icon="i-lucide-circle-x"
							aria-label="Clear input"
							@click="searchQuery = ''"
						/>
					</template>
				</UInput>
				<div class="flex gap-2">
					<UCheckbox
						v-model="freeEntrance"
						variant="card"
						label="入場無料"
						size="sm"
					/>
					<UCheckbox
						v-model="freeParking"
						variant="card"
						label="無料駐車場"
						size="sm"
					/>
				</div>
			</UContainer>
			<UContainer>
				<UPageGrid>
					<SpotCard
						v-for="spot in spots"
						:key="spot.name"
						:name="spot.name"
						:description="spot.description"
						:address="spot.address"
						:to="`/${spot.stem}`"
						:image="spot.image"
					/>
				</UPageGrid>
			</UContainer>
		</UPageBody>
	</UPage>
</template>
