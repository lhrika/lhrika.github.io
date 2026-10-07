<template>
	<DefineTemplate v-slot="{ classes }">
		<div
			class="flex-col items-center justify-center h-32 lg:h-48"
			:class="classes"
		>
			<div class="flex justify-center items-start gap-2 text-lg lg:text-2xl">
				꒰୨⁺
				<span class="text-3xl lg:text-5xl font-fancy font-bold text-highlighted"
					>Huyễn Cảnh Lưu Ly</span
				>
				⁺୧꒱
			</div>
			<div class="text-lg lg:text-2xl">· · ─ ·𖥸· ─ · ·</div>
		</div>
	</DefineTemplate>
	<ReuseTemplate classes="hidden lg:flex uppercase" />

	<UHeader
		:title="pageTitle"
		mode="drawer"
		toggle-side="left"
		:ui="{
			root: 'border-0 touch-none transition-[top,opacity] duration-400 ease-in-out',
			container: 'flex py-4',
			center: 'justify-center',
			body: 'space-y-4',
		}"
		:class="{
			'-top-(--ui-header-height)': !store.showHeader,
			'opacity-0': !store.showHeader,
		}"
	>
		<UNavigationMenu :items="items" />
		<template #bottom>
			<div ref="headerBottom" class="absolute bottom-0" />
		</template>
		<template #right>
			<LocaleMenu />
			<ThemePalette />
			<UColorModeButton />
			<USeparator orientation="vertical" class="h-8 hidden lg:block" />
			<LoggedInUser v-if="route.path !== '/login'" class="hidden lg:flex" />
		</template>
		<template #body>
			<UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
			<USeparator />
			<div class="flex justify-center items-center space-x-2">
				<LoggedInUser v-if="route.path !== '/login'" />
			</div>
		</template>
	</UHeader>
	<ReuseTemplate classes="flex lg:hidden" />
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import {
	createReusableTemplate,
	useSwipe,
	useWindowScroll,
	useElementSize,
} from '@vueuse/core'

const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{
	classes: string
}>()

// App store
const store = useAppStore()
const headerBottom = useTemplateRef('headerBottom')
const headerElement = computed(() => headerBottom.value?.parentElement)
const { direction } = useSwipe(headerElement)
const { y } = useWindowScroll()
const { height } = useElementSize(headerElement)
watchEffect(() => {
	if (direction.value === 'up') {
		store.showHeader = false
	}
})
watchEffect(() => {
	if (y.value < height.value) {
		store.showHeader = true
	}
})

// I18n
const { t } = useI18n()
const localePath = useLocalePath()

// Page title
const route = useRoute()
const pageTitle = computed(() =>
	route.meta.headerTitle ? t(route.meta.headerTitle as string) : '',
)
// Navigation Menu
const items = computed<NavigationMenuItem[]>(() => [
	{
		label: t('header.navigation.home'),
		to: localePath('/'),
		icon: 'i-lucide-house',
	},
	{
		label: t('header.navigation.blog'),
		to: localePath('/blog'),
		icon: 'i-lucide-book-open',
	},
	{
		label: t('header.navigation.library'),
		to: localePath('/library'),
		icon: 'i-lucide-library',
	},
	{
		label: '観光スポット',
		to: localePath('/spots', 'ja'),
		icon: 'i-lucide-trees',
	},
	{
		label: 'APP',
		icon: 'i-lucide-layout-grid',
		children: [
			{
				label: '临时收纳',
				to: localePath('/app/tmp'),
				icon: 'i-lucide-folder-lock',
			},
			{
				label: '家計簿',
				to: localePath('/app/kakeibo'),
				icon: 'i-lucide-wallet',
			},
			{
				label: t('header.navigation.dictionary'),
				to: localePath('/app/dictionary'),
				icon: 'i-lucide-book',
			},
			{
				label: t('header.navigation.adv'),
				to: localePath('/app/adv'),
				icon: 'i-lucide-book-open-text',
			},
			{
				label: 'Google Photos Direct URL',
				icon: 'i-lucide-aperture',
				to: localePath('/app/google-photos-direct-url'),
			},
			{
				icon: 'i-lucide-book-heart',
				label: t('header.navigation.diary'),
				to: localePath('/app/diary'),
			},
			{
				icon: 'i-lucide-file-text',
				label: 'PDF Reader',
				to: localePath('/app/pdf'),
			},
			{
				icon: 'i-lucide-list-todo',
				label: 'Routine',
				to: localePath('/app/routine'),
			},
			{
				icon: 'i-lucide-combine',
				label: '图片拼接',
				to: localePath('/app/image-stitch'),
			},
		],
	},
])
</script>
