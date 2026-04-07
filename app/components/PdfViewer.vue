<script setup lang="ts">
import {
	useElementSize,
	useScreenOrientation,
	useFullscreen,
} from '@vueuse/core'

const props = defineProps<{
	url: string
}>()

// Template refs
const canvasRef = useTemplateRef('canvas')
const viewportRef = useTemplateRef('viewport')
const settingsFormRef = useTemplateRef('settingsForm')

// PDF store
const store = usePDFStore()

// Jump page target
const jumpTargetPage = ref(1)

// Viewport size
const viewportSize = useElementSize(viewportRef)

// Screen orientation
const {
	orientation: screenOrientation,
	isSupported: isScreenOrientationSupported,
} = useScreenOrientation()
const isLandscape = computed(() => {
	return screenOrientation.value?.startsWith('landscape')
})

// Full screen API
const {
	isSupported: isFullscreenSupported,
	toggle: toggleFullscreen,
	isFullscreen,
} = useFullscreen(viewportRef)

// Reactive PDF
const pdf = usePDF(props.url)

// Render mode (page or section)
const renderMode = ref<'page' | 'section'>('section')
const getRenderModeIcon = () => {
	switch (renderMode.value) {
		case 'page':
			return 'i-lucide-crop'
		case 'section':
			return 'i-lucide-maximize'
	}
}
const switchRenderMode = () => {
	if (renderMode.value === 'page') {
		renderMode.value = 'section'
	} else if (renderMode.value === 'section') {
		renderMode.value = 'page'
	}
	render()
}

// Settings form
const isSettingsPopupOpen = ref(false)
const showSettings = ref(false)
const toggleShowSettings = () => {
	showSettings.value = !showSettings.value
}
const onTransitionEnter = () => {
	if (!showSettings.value) {
		render()
	}
}

const onSettingsSubmit = () => {
	render()
}

// Current section index
const sectionIndex = ref(1)

// Section offset Y
const sectionOffset = computed(() => {
	const contentTop = pdf.contentBounding.value.top
	if (!store.sectionHeight) {
		return 0
	}
	const offset = contentTop - sectionIndex.value * store.sectionHeight
	return offset < 0 ? 0 : offset
})

// Total sections
const totalSections = computed(() => {
	const pageHeight = pdf.contentBounding.value.height
	if (!pageHeight || !store.sectionHeight) {
		return 0
	}
	return Math.ceil(pageHeight / store.sectionHeight)
})

// Next section
const nextSection = () => {
	if (sectionIndex.value < totalSections.value) {
		sectionIndex.value += 1
		render()
	} else if (pdf.pageNumber.value < pdf.numPages) {
		pdf.pageNumber.value += 1
		sectionIndex.value = 1
	}
}

const hasNextSection = computed(() => {
	return (
		sectionIndex.value < totalSections.value ||
		pdf.pageNumber.value < pdf.numPages
	)
})

// Prev section
const prevSection = () => {
	if (sectionIndex.value > 1) {
		sectionIndex.value -= 1
		render()
	} else if (pdf.pageNumber.value > 1) {
		pdf.pageNumber.value -= 1
		sectionIndex.value = totalSections.value
	}
}

const hasPrevSection = computed(() => {
	return sectionIndex.value > 1 || pdf.pageNumber.value > 1
})

const jumpPage = () => {
	if (jumpTargetPage.value) {
		pdf.pageNumber.value = jumpTargetPage.value
	}
	isSettingsPopupOpen.value = false
}

// Function to adjust scale based on viewport width
const adjustScale = () => {
	settingsFormRef.value?.adjustScale(viewportSize.width.value)
}

watch(pdf.document, newValue => {
	if (newValue) {
		pdf.pageNumber.value = 1
	}
})

watch(pdf.page, async () => {
	const bounding = await pdf.detectContentBounding(
		'#FFFFFF',
		5,
		store.cropMarginX,
		store.cropMarginY,
	)
	if (store.autoCrop) {
		store.cropX = bounding.left
		store.cropWidth = bounding.width
	}
	if (sectionIndex.value > totalSections.value) {
		sectionIndex.value = totalSections.value
	}
	await render()
})

watch(isSettingsPopupOpen, value => {
	if (!value) {
		settingsFormRef.value?.submit()
	}
})

// Rendering state
const isRendering = ref(false)

const render = async () => {
	if (!pdf.page.value || isRendering.value || !canvasRef.value) {
		return
	}
	isRendering.value = true
	if (renderMode.value === 'section') {
		const margin = store.margin
		const y = sectionOffset.value - margin
		const height = store.sectionHeight + 2 * margin
		await pdf.renderPageRegion(
			canvasRef.value,
			store.cropX,
			y,
			store.cropWidth,
			height,
			store.scale,
		)?.promise
		if (store.margin) {
			drawGradientOverlay(canvasRef.value, store.margin * store.scale)
		}
	} else if (renderMode.value === 'page') {
		const task = pdf.renderPage(canvasRef.value, store.scale)
		await task?.promise
	}
	isRendering.value = false
}

const drawGradientOverlay = (canvas: HTMLCanvasElement, height: number) => {
	const ctx = canvas.getContext('2d')
	if (!ctx) return

	const dpr = window.devicePixelRatio || 1

	const gradTop = ctx.createLinearGradient(0, 0, 0, height * dpr)
	gradTop.addColorStop(1, 'rgb(255 255 255 / 0.4)')
	gradTop.addColorStop(0.5, 'rgb(255 255 255 / 0.7)')
	gradTop.addColorStop(0, 'rgb(255 255 255)')
	ctx.fillStyle = gradTop
	ctx.fillRect(0, 0, canvas.width, height * dpr)

	const gradBottom = ctx.createLinearGradient(
		0,
		canvas.height - height * dpr,
		0,
		canvas.height,
	)
	gradBottom.addColorStop(0, 'rgb(255 255 255 / 0.4)')
	gradBottom.addColorStop(0.5, 'rgb(255 255 255 / 0.7)')
	gradBottom.addColorStop(1, 'rgb(255 255 255)')
	ctx.fillStyle = gradBottom
	ctx.fillRect(0, canvas.height - height * dpr, canvas.width, height * dpr)
}

watch(
	() => props.url,
	() => {
		pdf.pageNumber.value = 1
		sectionIndex.value = 1
		pdf.load(props.url)
	},
)
</script>

<template>
	<ClientOnly>
		<div class="flex flex-col items-center gap-2">
			<div
				ref="viewport"
				class="w-full relative overflow-clip bg-muted min-h-48 flex flex-col justify-center items-center"
			>
				<div class="absolute top-4 right-4 flex gap-2">
					<UButton
						v-if="isFullscreenSupported"
						color="neutral"
						variant="subtle"
						icon="i-lucide-fullscreen"
						@click="toggleFullscreen"
					/>
					<UButton
						:icon="getRenderModeIcon()"
						variant="subtle"
						color="neutral"
						@click="switchRenderMode"
					/>
					<UPopover
						v-if="!isFullscreen && !isLandscape"
						v-model:open="isSettingsPopupOpen"
						:ui="{
							content: 'p-4 max-w-xs space-y-4',
						}"
					>
						<UButton icon="i-lucide-settings" variant="soft" color="neutral" />
						<template #content>
							<PdfViewerSettingForm
								ref="settingsForm"
								@adjust-scale="adjustScale"
								@submit="onSettingsSubmit"
							/>
							<UFormField
								label="Go to page"
								orientation="horizontal"
								:ui="{
									label: 'text-nowrap',
								}"
							>
								<UFieldGroup>
									<UInputNumber
										v-model="jumpTargetPage"
										:increment="false"
										:decrement="false"
										:default-value="1"
									/>
									<UButton icon="i-lucide-check" @click="jumpPage" />
								</UFieldGroup>
							</UFormField>
						</template>
					</UPopover>
					<UButton
						v-else
						icon="i-lucide-settings"
						variant="soft"
						color="neutral"
						@click="toggleShowSettings"
					/>
				</div>
				<Transition
					mode="out-in"
					enter-active-class="transition-all duration-250 ease-in-out"
					enter-from-class="opacity-0 translate-x-10"
					enter-to-class="opacity-100 translate-x-0"
					leave-active-class="transition-all duration-250 ease-in-out"
					leave-from-class="opacity-100 translate-x-0"
					leave-to-class="opacity-0 -translate-x-10"
					@enter="onTransitionEnter"
				>
					<div v-if="showSettings" class="bg-default p-4">
						<PdfViewerSettingForm
							ref="settingsForm"
							@adjust-scale="adjustScale"
							@submit="onSettingsSubmit"
						/>
					</div>
					<canvas v-else ref="canvas" @click="nextSection" />
				</Transition>
				<UFieldGroup
					v-if="renderMode === 'section'"
					orientation="vertical"
					class="absolute bottom-4 right-4"
				>
					<UButton
						icon="i-lucide-chevron-up"
						color="neutral"
						variant="soft"
						:disabled="!hasPrevSection || isRendering"
						@click="prevSection"
					/>
					<UButton
						icon="i-lucide-chevron-down"
						color="neutral"
						variant="soft"
						:disabled="!hasNextSection || isRendering"
						@click="nextSection"
					/>
				</UFieldGroup>
			</div>
			<UPagination
				v-if="pdf.numPages"
				v-model:page="pdf.pageNumber.value"
				:items-per-page="1"
				:total="pdf.numPages"
				:disabled="isRendering"
			/>
		</div>
	</ClientOnly>
</template>
