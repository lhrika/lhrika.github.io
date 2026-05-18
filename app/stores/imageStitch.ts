import { defineStore } from 'pinia'

// Only metadata — no image data. Blobs are stored in IndexedDB.
export interface StitchImageMeta {
	id: string
	name: string
	x: number
	y: number
	width: number
	height: number
	zIndex: number
}

export const useImageStitchStore = defineStore(
	'image-stitch',
	() => {
		const imageMetas = ref<StitchImageMeta[]>([])
		const canvasWidth = ref(1200)
		const canvasHeight = ref(800)
		const canvasBg = ref('#ffffff')

		return { imageMetas, canvasWidth, canvasHeight, canvasBg }
	},
	{
		persist: true,
	},
)
