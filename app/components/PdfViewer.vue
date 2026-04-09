<script setup lang="ts">
import {
	useElementSize,
	useScreenOrientation,
	useFullscreen,
} from '@vueuse/core'
import chroma from 'chroma-js'

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

// Viewport background color
const viewportBgColor = ref('#FFFFFF')
const colorPickerIconColor = computed(() => {
	const c = chroma(viewportBgColor.value)
	if (c.luminance() > 0.5) {
		return 'text-neutral-700'
	}
	return 'text-white'
})

const isColorPickerOpen = ref(false)

// Screen orientation
const {
	orientation: screenOrientation,
	isSupported: isScreenOrientationSupported,
} = useScreenOrientation()
const deviceOrientation = usePhysicalScreenOrientation()
const isLandscape = computed(() => {
	return screenOrientation.value?.startsWith('landscape')
})
const shouldRotateScreen = computed(() => {
	if (
		!isScreenOrientationSupported.value ||
		!deviceOrientation.isSupported.value ||
		!isFullscreen.value
	)
		return false
	return (
		(isLandscape.value && deviceOrientation.isPortrait.value) ||
		(!isLandscape.value && deviceOrientation.isLandscape.value)
	)
})
const rotateScreen = () => {
	if (deviceOrientation.isLandscape.value) {
		screenOrientation.value = 'landscape-primary'
	} else if (deviceOrientation.isPortrait.value) {
		screenOrientation.value = 'portrait-primary'
	}
}

// Full screen API
const {
	isSupported: isFullscreenSupported,
	toggle: toggleFullscreen,
	isFullscreen,
} = useFullscreen(viewportRef)

// Reactive PDF
const pdf = usePDF(store.url)
const pageNumber = computed({
	get() {
		return store.page
	},
	set(value) {
		pdf.setPage(value)
		store.page = value
	},
})

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

// Color captor
const colorCaptor = useCanvasColorCaptor(color => {
	viewportBgColor.value = color
})
const grabColor = () => {
	if (canvasRef.value) {
		colorCaptor.capture(canvasRef.value)
		isColorPickerOpen.value = false
	}
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
	} else if (pageNumber.value < pdf.numPages) {
		pageNumber.value += 1
		sectionIndex.value = 1
	}
}

const hasNextSection = computed(() => {
	return (
		sectionIndex.value < totalSections.value || pageNumber.value < pdf.numPages
	)
})

// Prev section
const prevSection = () => {
	if (sectionIndex.value > 1) {
		sectionIndex.value -= 1
		render()
	} else if (pageNumber.value > 1) {
		pageNumber.value -= 1
		sectionIndex.value = totalSections.value
	}
}

const hasPrevSection = computed(() => {
	return sectionIndex.value > 1 || pageNumber.value > 1
})

const jumpPage = () => {
	if (jumpTargetPage.value) {
		pageNumber.value = jumpTargetPage.value
	}
	isSettingsPopupOpen.value = false
}

// Function to adjust scale based on viewport width
const adjustScale = () => {
	settingsFormRef.value?.adjustScale(viewportSize.width.value)
}

watch(pdf.document, () => {
	if (!store.document) {
		pdf.getInfo().then(info => {
			store.addToHistory({
				url: store.url,
				title: info.Title as string | undefined,
				page: 1,
			})
		})
	}
	pdf.setPage(store.page)
})

const cropPage = async () => {
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
}

watch(pdf.page, async () => {
	await cropPage()
	await render()
})

const onSettingsSubmit = () => {
	showSettings.value = false
	cropPage().then(render)
}

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
	() => store.url,
	value => {
		sectionIndex.value = 1
		pdf.url.value = value
	},
)
</script>

<template>
	<ClientOnly>
		<div class="flex flex-col items-center gap-2">
			<div
				ref="viewport"
				class="w-full relative overflow-clip min-h-48 flex flex-col justify-center items-center"
				:style="`background-color:${viewportBgColor}`"
			>
				<UPopover
					v-if="!isFullscreen"
					v-model:open="isColorPickerOpen"
					:ui="{
						content: 'p-2 flex flex-col gap-2',
					}"
				>
					<UButton
						icon="i-lucide-paint-bucket"
						color="neutral"
						variant="subtle"
						class="absolute top-4 left-4"
						:class="colorPickerIconColor"
						:style="`background-color:${viewportBgColor};`"
					/>
					<template #content>
						<div class="flex items-center justify-between gap-2">
							<span class="font-bold">Set background color</span>
							<UButton
								icon="i-lucide-pipette"
								color="neutral"
								variant="soft"
								@click="grabColor"
							/>
						</div>
						<UColorPicker v-model="viewportBgColor" format="hex" />
					</template>
				</UPopover>
				<div class="absolute top-4 right-4 flex gap-2">
					<UButton
						v-if="isFullscreenSupported"
						color="neutral"
						variant="subtle"
						icon="i-lucide-fullscreen"
						@click="
							() => {
								toggleFullscreen()
								showSettings = false
							}
						"
					/>
					<UButton
						:icon="getRenderModeIcon()"
						variant="subtle"
						color="neutral"
						@click="switchRenderMode"
					/>
					<UButton
						v-if="isFullscreen"
						icon="i-lucide-settings"
						variant="soft"
						color="neutral"
						@click="toggleShowSettings"
					/>
					<UPopover
						v-else
						v-model:open="isSettingsPopupOpen"
						:ui="{
							content: 'p-4 max-w-xs space-y-4',
						}"
						@update:open="
							value => {
								if (!value) {
									settingsFormRef?.submit()
								}
							}
						"
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
					<div v-if="showSettings" class="bg-default p-4 w-full">
						<PdfViewerSettingForm
							ref="settingsForm"
							has-submit-button
							class="max-w-sm mx-auto"
							@adjust-scale="adjustScale"
							@submit="onSettingsSubmit"
						/>
					</div>
					<canvas
						v-else
						ref="canvas"
						:class="{ 'cursor-pipette': colorCaptor.isCapturing.value }"
						@click="
							() => {
								if (!colorCaptor.isCapturing.value) {
									nextSection()
								}
							}
						"
					/>
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
				<div class="absolute left-4 bottom-4 flex flex-col gap-2">
					<UButton
						v-if="shouldRotateScreen"
						icon="i-lucide-ratio"
						color="neutral"
						variant="subtle"
						class="rounded-full size-5 animate-[rotate-cw_4s_ease_infinite]"
						@click="rotateScreen"
					/>
					<CompactPagination
						v-if="isFullscreen"
						v-model="pageNumber"
						:total="pdf.numPages"
						size="sm"
					/>
				</div>
			</div>
			<UPagination
				v-if="pdf.numPages"
				v-model:page="pageNumber"
				:items-per-page="1"
				:total="pdf.numPages"
				:disabled="isRendering"
			/>
		</div>
	</ClientOnly>
</template>

<style>
@keyframes rotate-cw {
	0% {
		rotate: 0;
	}
	25% {
		rotate: 90deg;
	}
	50% {
		rotate: 180deg;
	}
	75% {
		rotate: 270deg;
	}
	100% {
		rotate: 360deg;
	}
}
</style>
