<template>
	<UPage>
		<UPageBody>
			<UContainer class="flex justify-between items-center">
				<UFieldGroup class="w-full">
					<UInput v-model="inputUrl" placeholder="URL of PDF" class="w-full" />
					<UPopover
						v-model:open="isHistoryOpen"
						:ui="{
							content: 'p-2 space-y-2',
						}"
					>
						<UButton icon="i-lucide-history" color="neutral" variant="subtle" />
						<template #content>
							<UFieldGroup
								v-for="(item, index) in store.history.filter(
									e => e.url !== store.url,
								)"
								:key="item.url"
								class="flex"
							>
								<UButton
									color="neutral"
									variant="outline"
									class="w-full block text-start text-nowrap overflow-hidden text-ellipsis"
									@click="
										() => {
											store.url = item.url
											isHistoryOpen = false
										}
									"
								>
									{{ item.title || item.url }}
								</UButton>
								<UButton
									icon="i-lucide-delete"
									color="error"
									variant="outline"
									@click="
										() => {
											store.history.splice(index, 1)
										}
									"
								/>
							</UFieldGroup>
						</template>
					</UPopover>
					<UButton label="Load" @click="loadPDF" />
				</UFieldGroup>
			</UContainer>
			<UContainer>
				<PdfViewer v-if="store.url" :url="store.url" />
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
const inputUrl = ref('')
const isHistoryOpen = ref(false)
const loadPDF = () => {
	store.url = inputUrl.value
}
const store = usePDFStore()
</script>
