<template>
	<div
		class="uppercase hidden lg:flex flex-col items-center justify-center h-48"
	>
		<div class="flex justify-center items-start gap-2 text-2xl">
			꒰୨⁺<span class="text-5xl font-fancy font-bold text-primary"
				>Huyễn Cảnh Lưu Ly</span
			>⁺୧꒱
		</div>
		<div class="text-2xl">· · ─ ·𖥸· ─ · ·</div>
	</div>
	<UHeader
		:title="pageTitle"
		mode="drawer"
		:ui="{
			root: 'border-0',
			container: 'flex py-4',
			center: 'justify-center',
		}"
	>
		<template #left>
			<div class="font-bold text-lg">
				{{ pageTitle }}
			</div>
		</template>
		<UNavigationMenu :items="items" />
		<template #right>
			<div class="flex gap-4 items-center justify-end">
				<ULocaleSelect
					:model-value="locale"
					:locales="Object.values(availableLocales)"
					@update:model-value="updateLocale"
				/>
				<UColorModeButton />
				<ThemePalette />
			</div>
		</template>
		<template #body>
			<UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
		</template>
	</UHeader>
	<div class="lg:hidden flex flex-col items-center justify-center h-32">
		<div class="text-lg flex justify-center items-start gap-2">
			꒰୨⁺<span class="text-3xl font-bold text-primary font-fancy"
				>Huyễn Cảnh Lưu Ly</span
			>⁺୧꒱
		</div>
		<div class="text-lg">· · ─ ·𖥸· ─ · ·</div>
	</div>
</template>

<script setup lang="ts">
import * as uiLocales from '@nuxt/ui/locale'
import type { NavigationMenuItem } from '@nuxt/ui'

// Page title
const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string) || '')

// I18n
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const availableLocales = computed(() => {
	return Object.values(uiLocales).filter(uiLocale =>
		locales.value.find(l => l.code === uiLocale.code),
	)
})

const updateLocale = (code: string) => {
	// @ts-expect-error code is string
	navigateTo(switchLocalePath(code))
}

// Navigation Menu
const items = computed<NavigationMenuItem[]>(() => [
	{
		label: t('home'),
		to: '/',
		icon: 'i-lucide-house',
	},
	{
		label: t('blog'),
		to: '/blog',
		icon: 'i-lucide-book-open',
	},
	{
		label: t('dictionary'),
		to: '/dictionary',
		icon: 'i-lucide-book',
	},
	{
		label: t('about'),
		to: '/about',
		icon: 'i-lucide-user-circle',
	},
	{
		label: t('contact'),
		to: '/contact',
		icon: 'i-lucide-mail',
	},
	{
		label: 'APP',
		icon: 'i-lucide-layout-grid',
		children: [
			{
				label: '家計簿',
				to: '/kakeibo',
				icon: 'i-lucide-wallet',
			},
			{
				label: t('adv'),
				to: '/adv',
				icon: 'i-lucide-book-open-text',
			},
			{
				label: 'Google Photos Direct URL',
				icon: 'i-lucide-aperture',
				to: '/app/google-photos-direct-url',
			},
		],
	},
])
</script>
