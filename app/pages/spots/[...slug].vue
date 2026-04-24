<script setup lang="ts">
// Force ja locale
definePageMeta({
	i18n: {
		locales: ['ja'],
	},
})

const { locale, setLocale } = useI18n()
if (locale.value !== 'ja') {
	setLocale('ja')
}

const route = useRoute()
const slug = computed(() => {
	const s = route.params.slug
	const list = typeof s === 'string' ? [s] : (s ?? [])
	return list.filter(s => s.length > 0)
})

const { data: spot } = await useAsyncData(
	() => `spots-${slug.value.length > 0 ? slug.value.join('-') : 'list'}`,
	() => {
		return queryCollection('spots')
			.where('stem', '=', `spots/${slug.value.join('/')}`)
			.first()
	},
	{
		watch: [slug],
	},
)

// SEO meta
useHead({
	title: () => spot.value?.name ?? 'ページが見つかりません',
})

watch(
	slug,
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
		<UPageHeader
			:links="[
				{
					icon: 'i-lucide-undo-2',
					label: '一覧に戻る',
					to: '/spots',
					variant: 'link',
				},
			]"
			:description="spot?.description"
			:ui="{
				wrapper: 'flex-col-reverse',
				description: 'whitespace-pre-wrap',
			}"
		>
			<template #title>
				<template v-if="spot">
					<ruby v-if="spot?.furigana"
						>{{ spot?.name }}<rp>（</rp
						><rt class="text-muted">{{ spot?.furigana }}</rt
						><rp>）</rp></ruby
					>
					<template v-else>{{ spot?.name }}</template>
				</template>
				<template v-else>ページが見つかりません</template>
			</template>
		</UPageHeader>
		<UPageBody>
			<!-- Basic Info -->
			<UContainer v-if="spot" class="space-y-6">
				<SpotInfo
					:business-hours="spot.businessHours"
					:postcode="spot.postcode"
					:address="spot.address"
					:parking="spot.parking"
					:fee="spot.fee"
				/>
			</UContainer>
			<!-- Highlights -->
			<UContainer v-if="spot" class="bg-muted py-6">
				<div v-if="spot.highlights.length" class="space-y-4">
					<h2
						class="text-xl sm:text-2xl lg:text-3xl font-bold text-center py-4"
					>
						見どころ
					</h2>
					<div class="space-y-4">
						<SpotHighlight
							v-for="(highlight, index) in spot.highlights"
							:key="index"
							v-bind="highlight"
							class="bg-default rounded-md p-2"
						/>
					</div>
				</div>
			</UContainer>
			<!-- Links -->
			<UContainer v-if="spot?.links.length" class="space-y-4">
				<h2 class="text-lg lg:text-xl font-bold">リンク</h2>
				<ul class="space-y-2 list-disc list-inside px-4">
					<li v-for="(link, index) in spot.links" :key="index">
						<ULink :to="link.url" :target="link.target">{{ link.label }}</ULink>
					</li>
				</ul>
			</UContainer>
			<UEmpty
				v-if="!spot"
				title="スポットが見つかりません"
				variant="naked"
				:actions="[
					{
						label: '一覧に戻る',
						to: '/spots',
						variant: 'outline',
					},
				]"
			/>
		</UPageBody>
	</UPage>
</template>
