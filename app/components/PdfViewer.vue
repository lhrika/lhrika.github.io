<script setup lang="ts">
import {
	useElementSize,
	useScreenOrientation,
	useFullscreen,
} from '@vueuse/core'
import * as z from 'zod/v4'

const props = defineProps<{
	url: string
}>()

// Template refs
const canvasRef = useTemplateRef('canvas')
const viewportRef = useTemplateRef('viewport')
const settingsFormRef = useTemplateRef('settingsForm')

// Jump page target
const jumpTargetPage = ref(1)

// Viewport size
const viewportSize = useElementSize(viewportRef)

// Screen orientation
const {
	orientation: screenOrientation,
	isSupported: isScreenOrientationSupported,
} = useScreenOrientation()
const settingsPopupClasses = computed(() => {
	if (
		isScreenOrientationSupported.value &&
		screenOrientation.value?.startsWith('landscape')
	) {
		return 'p-4 max-w-sm space-y-4 max-h-64 overflow-y-auto'
	} else {
		return 'p-4 max-w-xs space-y-4'
	}
})

// Full screen API
const fullscreen = useFullscreen(viewportRef)

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
const isSettingsOpen = ref(false)
const schema = z.object({
	cropX: z.number().nonnegative(),
	cropY: z.number().nonnegative(),
	cropWidth: z.number().nonnegative(),
	cropHeight: z.number().nonnegative(),
	cropMarginX: z.number().nonnegative(),
	cropMarginY: z.number().nonnegative(),
	autoCrop: z.boolean(),
	sectionHeight: z.number().positive(),
	scale: z.number().positive(),
	margin: z.number().nonnegative(),
})
type Schema = z.output<typeof schema>
const settings = reactive<Schema>({
	cropX: 0,
	cropY: 0,
	cropWidth: 500,
	cropHeight: 1000,
	cropMarginX: 0,
	cropMarginY: 0,
	autoCrop: false,
	sectionHeight: 200,
	scale: 1,
	margin: 30,
})
const onSettingsSubmit = () => {
	render()
}

// Current section index
const sectionIndex = ref(1)

// Section offset Y
const sectionOffset = computed(() => {
	const contentTop = pdf.contentBounding.value.top
	if (!settings.sectionHeight) {
		return 0
	}
	const offset = contentTop - sectionIndex.value * settings.sectionHeight
	return offset < 0 ? 0 : offset
})

// Total sections
const totalSections = computed(() => {
	const pageHeight = pdf.contentBounding.value.height
	if (!pageHeight || !settings.sectionHeight) {
		return 0
	}
	return Math.ceil(pageHeight / settings.sectionHeight)
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
	isSettingsOpen.value = false
}

// Function to adjust scale based on viewport width
const adjustScale = () => {
	const viewportWidth = viewportSize.width.value
	if (settings.cropWidth) {
		settings.scale = viewportWidth / settings.cropWidth
	}
}

watch(pdf.document, newValue => {
	if (newValue) {
		pdf.pageNumber.value = 1
	}
})

watch(pdf.page, async () => {
	const bounding = await pdf.detectContentBounding()
	if (settings.autoCrop) {
		settings.cropX = bounding.left
		settings.cropWidth = bounding.width
	}
	if (sectionIndex.value > totalSections.value) {
		sectionIndex.value = totalSections.value
	}
	await render()
})

watch(isSettingsOpen, value => {
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
		const margin = settings.margin
		const y = sectionOffset.value - margin
		const height = settings.sectionHeight + 2 * margin
		await pdf.renderPageRegion(
			canvasRef.value,
			settings.cropX,
			y,
			settings.cropWidth,
			height,
			settings.scale,
		)?.promise
		if (settings.margin) {
			drawGradientOverlay(canvasRef.value, settings.margin * settings.scale)
		}
	} else if (renderMode.value === 'page') {
		const task = pdf.renderPage(canvasRef.value, settings.scale)
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
						v-if="fullscreen.isSupported.value"
						color="neutral"
						variant="subtle"
						icon="i-lucide-fullscreen"
						@click="fullscreen.toggle"
					/>
					<UButton
						:icon="getRenderModeIcon()"
						variant="subtle"
						color="neutral"
						@click="switchRenderMode"
					/>
					<UPopover
						v-model:open="isSettingsOpen"
						:ui="{
							content: settingsPopupClasses,
						}"
					>
						<UButton icon="i-lucide-settings" variant="soft" color="neutral" />
						<template #content>
							<UForm
								ref="settingsForm"
								:state="settings"
								:schema="schema"
								class="space-y-4"
								@submit="onSettingsSubmit"
							>
								<USwitch v-model="settings.autoCrop" label="Auto Crop" />
								<UFormField
									v-if="settings.autoCrop"
									label="Auto crop margin"
									name="cropMarginX"
								>
									<UInput v-model="settings.cropMarginX" />
								</UFormField>
								<div v-else class="flex gap-2">
									<UFormField label="Crop X" name="cropX">
										<UInputNumber v-model="settings.cropX" class="flex-1" />
									</UFormField>
									<UFormField label="Crop Width" name="cropWidth">
										<UInputNumber v-model="settings.cropWidth" class="flex-1" />
									</UFormField>
								</div>
								<UFormField label="Section Height" name="numSections">
									<UInputNumber v-model="settings.sectionHeight" />
								</UFormField>
								<UFormField label="Top/Bottom Margin" name="margin">
									<UInputNumber v-model="settings.margin" />
								</UFormField>
								<UFormField label="Scale" name="scale">
									<UFieldGroup>
										<UInputNumber v-model="settings.scale" :step="0.1" />
										<UButton
											label="Auto"
											color="neutral"
											variant="outline"
											@click="adjustScale"
										/>
									</UFieldGroup>
								</UFormField>
							</UForm>
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
				<canvas ref="canvas" @click="nextSection" />
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
