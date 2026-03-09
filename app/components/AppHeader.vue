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
		:ui="{
			root: 'border-0',
			container: 'flex py-4',
			center: 'justify-center',
			body: 'space-y-4',
		}"
	>
		<UNavigationMenu :items="items" />
		<template #left>
			<div class="font-bold text-lg">
				{{ pageTitle }}
			</div>
		</template>
		<template #right>
			<LocaleMenu />
			<ThemePalette />
			<UColorModeButton />
			<UUser
				v-if="route.path !== '/login'"
				:name="user?.profile?.name ?? $t('login')"
				:avatar="{
					src: user?.profile?.avatar,
					icon: 'i-lucide-user',
				}"
				:to="
					user
						? undefined
						: `/login?redirect=${encodeURIComponent(route.fullPath)}`
				"
				:ui="{
					name: 'inline-flex items-center gap-2',
				}"
				class="hidden lg:flex"
			>
				<template #name>
					{{ user?.profile?.name ?? $t('login') }}
					<UIcon v-if="!user" name="i-lucide-log-in" class="size-4" />
				</template>
			</UUser>
		</template>
		<template #body>
			<UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
			<USeparator />
			<div class="flex justify-center items-center space-x-2">
				<UUser
					v-if="route.path !== '/login'"
					:name="user?.profile?.name ?? $t('login')"
					:avatar="{
						src: user?.profile?.avatar,
						icon: 'i-lucide-user',
					}"
					:to="user ? undefined : '/login'"
					:ui="{
						name: 'inline-flex items-center gap-2',
					}"
				>
					<template #name>
						{{ user?.profile?.name ?? $t('login') }}
						<UIcon v-if="!user" name="i-lucide-log-in" class="size-4" />
					</template>
				</UUser>
				<UButton
					v-if="user"
					size="sm"
					variant="ghost"
					color="neutral"
					icon="i-lucide-log-out"
					@click="
						() => {
							supabase.auth.signOut()
						}
					"
				/>
			</div>
		</template>
	</UHeader>
	<ReuseTemplate classes="flex lg:hidden" />
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { createReusableTemplate } from '@vueuse/core'

const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{
	classes: string
}>()

// Page title
const route = useRoute()
const pageTitle = computed(() => (route.meta.title as string) || '')

// I18n
const { t } = useI18n()

// Supabase
const supabase = useSupabaseClient()
const user = useSupabaseUser()

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
