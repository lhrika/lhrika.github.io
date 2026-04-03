<template>
	<UPage>
		<UPageBody>
			<UContainer class="flex justify-between items-center">
				<UFieldGroup>
					<UInput v-model="inputUrl" />
					<UButton label="Load" @click="loadPDF" />
				</UFieldGroup>
				<USwitch v-model="hideHeader" label="Hide Header" />
			</UContainer>
			<UContainer>
				<PdfViewer :url="pdfUrl" />
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
const pdfUrl = ref('/cognitive-linguistics-an-introduction.pdf')
const inputUrl = ref('')
const loadPDF = () => {
	pdfUrl.value = inputUrl.value
}
const store = useAppStore()

const hideHeader = computed({
	get() {
		return !store.showHeader
	},
	set(value: boolean) {
		store.showHeader = !value
	},
})
</script>
