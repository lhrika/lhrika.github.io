export const useCanvasColorCaptor = (callback?: (color: string) => void) => {
	const isCapturing = ref(false)
	const color = shallowRef({ r: 255, g: 255, b: 255, a: 1 })

	const listener = (event: MouseEvent) => {
		const canvas = event.currentTarget as HTMLCanvasElement
		const ctx = canvas.getContext('2d')!
		const rect = canvas.getBoundingClientRect()

		// Adjust for canvas scaling (CSS vs physical pixels)
		const scaleX = canvas.width / rect.width
		const scaleY = canvas.height / rect.height

		const x = (event.clientX - rect.left) * scaleX
		const y = (event.clientY - rect.top) * scaleY

		// Get single pixel data
		const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1)
		const [r = 0, g = 0, b = 0, a = 1] = imageData.data
		const hex = `#${[r, g, b]
			.map(x => x.toString(16).padStart(2, '0'))
			.join('')
			.toUpperCase()}`

		// RGBA object
		color.value = { r, g, b, a }
		isCapturing.value = false

		if (callback) {
			callback(hex)
		}
	}

	const capture = (canvas: HTMLCanvasElement) => {
		isCapturing.value = true
		canvas.addEventListener('click', listener, { once: true })
	}

	return { capture, isCapturing, color }
}
