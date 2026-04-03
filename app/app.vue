<template>
	<UApp :locale="currentLocale">
		<AppHeader v-if="store.showHeader" />

		<UMain>
			<NuxtLayout>
				<NuxtPage />
			</NuxtLayout>
		</UMain>

		<AppFooter />
	</UApp>
</template>

<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const { locale } = useI18n()
const currentLocale = computed(() => {
	return locales[locale.value as keyof typeof locales]
})

// App store
const store = useAppStore()

useHead({
	htmlAttrs: {
		lang: locale.value,
	},
	titleTemplate(title) {
		return title ? `${title} - Huyễn Cảnh Lưu Ly` : 'Huyễn Cảnh Lưu Ly'
	},
})
</script>
