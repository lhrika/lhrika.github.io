import { defineStore } from 'pinia'

export const usePDFStore = defineStore(
	'pdf',
	() => {
		// Crop region in PDF points
		const cropX = ref(0)
		const cropWidth = ref(256)
		const cropY = ref(0)
		const cropHeight = ref(256)
		// Crop margins
		const cropMarginX = ref(0)
		const cropMarginY = ref(0)
		// Auto crop on/off
		const autoCrop = ref(false)
		// Section height
		const sectionHeight = ref(96)
		// Scale
		const scale = ref(1)
		// Margin on the top and bottom
		const margin = ref(10)
		return {
			cropX,
			cropWidth,
			cropY,
			cropHeight,
			cropMarginX,
			cropMarginY,
			autoCrop,
			sectionHeight,
			scale,
			margin,
		}
	},
	{
		persist: true,
	},
)
