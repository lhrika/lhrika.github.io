<template>
	<UPage>
		<UPageBody>
			<UContainer>
				<UFieldGroup>
					<UInput v-model="inputUrl" />
					<UButton label="Load" @click="loadPDF" />
				</UFieldGroup>
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
</script>
