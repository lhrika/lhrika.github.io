<script setup lang="ts">
import type { CollectionQueryBuilder } from '@nuxt/content'

definePageMeta({
	title: '観光・散策スポットまとめ',
	i18n: {
		locales: ['ja'],
	},
	path: '/spots/:id(\\d+)?',
})

const { locale, setLocale } = useI18n()
if (locale.value !== 'ja') {
	setLocale('ja')
}

const route = useRoute()
const { currentRoute } = useRouter()

// Free-text search
const ignorePattern = /^[\\":{}\s\n\t,a-zA-Z]+$/i
const keywords = computed(() =>
	((currentRoute.value.query.q as string) ?? '')
		.split(/\s+/)
		.filter(s => ignorePattern.exec(s) === null),
)
const searchQuery = ref((currentRoute.value.query.q as string) ?? '')
const compositioning = ref(false)
const search = () => {
	const q = searchQuery.value || undefined
	navigateTo({
		params: { id: 1 },
		query: { ...currentRoute.value.query, q },
	})
}
const onKeydown = (e: KeyboardEvent) => {
	if (!compositioning.value && e.code === 'Enter') {
		search()
	}
}

// Other condition filters
const freeParking = computed({
	get: () => currentRoute.value.query.freeParking === '1',
	set: value => {
		navigateTo({
			params: { id: 1 },
			query: {
				...currentRoute.value.query,
				freeParking: value ? '1' : undefined,
			},
		})
	},
})
const freeEntrance = computed({
	get: () => currentRoute.value.query.freeEntrance === '1',
	set: value =>
		navigateTo({
			params: { id: 1 },
			query: {
				...currentRoute.value.query,
				freeEntrance: value ? '1' : undefined,
			},
		}),
})

// Pagination
const page = computed(() => {
	const id = Array.isArray(route.params.id)
		? route.params.id[0]
		: route.params.id
	return parseInt(id ? id : '1')
})
const itemsPerPage = 3
const localePath = useLocalePath()
const paginationLinkTo = (page: number) => {
	const link = useLink({
		to: {
			params: {
				id: page,
			},
			query: route.query,
		},
	})
	return link.href.value
}

function filterQuery<T>(query: CollectionQueryBuilder<T>) {
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
}

const { data: total } = await useAsyncData(
	() => `spots-count`,
	() => {
		const query = queryCollection('spots')
		filterQuery(query)
		return query.count()
	},
	{
		watch: [freeEntrance, freeParking, keywords],
		getCachedData(key, nuxtApp, context) {
			if (context.cause === 'initial') {
				return nuxtApp.payload.data[key]
			}
			return undefined
		},
	},
)

const { data: spots } = useAsyncData(
	() => `spots-list-${page.value}`,
	() => {
		const query = queryCollection('spots')
		filterQuery(query)
		return query
			.skip((page.value - 1) * itemsPerPage)
			.limit(itemsPerPage)
			.all()
	},
	{
		watch: [freeEntrance, freeParking, keywords],
		getCachedData(key, nuxtApp, context) {
			if (context.cause === 'initial') {
				return nuxtApp.payload.data[key]
			}
			return undefined
		},
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
							@click="
								searchQuery = ''
								search()
							"
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
			<UContainer class="flex flex-col items-center gap-4">
				<UPageGrid>
					<SpotCard
						v-for="spot in spots"
						:key="spot.name"
						:name="spot.name"
						:description="spot.description"
						:address="spot.address"
						:to="localePath(`/${spot.stem}`)"
						:image="spot.image"
						:free="spot.fee === 0 && spot.parking === true"
					/>
				</UPageGrid>
				<UPagination
					v-if="total && total / itemsPerPage > 1"
					:page="page"
					:total="total"
					:items-per-page="itemsPerPage"
					:to="paginationLinkTo"
					class="mx-auto"
				/>
			</UContainer>
		</UPageBody>
	</UPage>
</template>
