<template>
	<UPage>
		<UPageBody>
			<UContainer class="flex justify-between items-center">
				<UFieldGroup>
					<UInput v-model="inputUrl" />
					<UPopover
						:ui="{
							content: 'p-2 space-y-2',
						}"
					>
						<UButton icon="i-lucide-history" color="neutral" variant="subtle" />
						<template #content>
							<UFieldGroup
								v-for="(item, index) in store.history"
								:key="item.url"
								class="flex justify-between"
							>
								<UButton
									color="neutral"
									variant="outline"
									class="w-full"
									@click="
										() => {
											store.url = item.url
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
				<USwitch v-model="hideHeader" label="Hide Header" />
			</UContainer>
			<UContainer>
				<PdfViewer :url="store.url" />
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
const inputUrl = ref('')
const loadPDF = () => {
	store.url = inputUrl.value
}
const appStore = useAppStore()
const store = usePDFStore()

const hideHeader = computed({
	get() {
		return !appStore.showHeader
	},
	set(value: boolean) {
		appStore.showHeader = !value
	},
})
</script>
