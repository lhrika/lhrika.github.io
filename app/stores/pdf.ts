import { defineStore } from 'pinia'

interface PDFHistoryEntry {
	url: string
	page: number
	title?: string
	timestamp: number
}

const MAX_HISTORY = 10

export const usePDFStore = defineStore(
	'pdf',
	() => {
		const history = ref<PDFHistoryEntry[]>([])
		const url = ref('')
		const document = computed(() => {
			return history.value.find(e => e.url === url.value)
		})

		function addToHistory(entry: Omit<PDFHistoryEntry, 'timestamp'>) {
			const timestamp = Date.now()
			const existing = history.value.findIndex(e => e.url === entry.url)
			if (existing !== -1) {
				history.value.splice(existing, 1)
			} else if (history.value.length >= MAX_HISTORY) {
				history.value.pop()
			}
			history.value.unshift({ ...entry, timestamp })
		}

		const page = computed({
			get() {
				return document.value?.page ?? 1
			},
			set(value) {
				if (document.value) {
					document.value.page = value
				}
			},
		})

		watch(url, value => {
			const i = history.value.findIndex(e => e.url === value)
			if (i > 0) {
				const [entry] = history.value.splice(i, 1)
				if (entry) {
					entry.timestamp = Date.now()
					history.value.unshift(entry)
				}
			}
		})

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
			url,
			history,
			document,
			page,
			addToHistory,
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
