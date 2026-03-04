<template>
	<UDropdownMenu :items>
		<UButton icon="i-lucide-languages" color="neutral" variant="ghost" />
	</UDropdownMenu>
</template>
<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const items = computed(() => {
	return locales.value
		.filter(i => i.code !== locale.value)
		.map(locale => {
			return {
				label: locale.name,
				onSelect() {
					setLocale(locale.code)
				},
			}
		})
})
</script>
