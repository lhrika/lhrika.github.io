import { joinURL } from 'ufo'
import { createOperationsGenerator, defineProvider } from '@nuxt/image/runtime'

const operationsGenerator = createOperationsGenerator({
	formatter(key, value) {
		return `${key}${value}`
	},
	joinWith: '-',
	keyMap: {
		width: 'w',
		height: 'h',
	},
})

export default defineProvider<{ baseURL?: string }>({
	getImage(src, { modifiers, baseURL }) {
		const operations = operationsGenerator(modifiers)
		return {
			url: joinURL(
				baseURL ?? '',
				src + (operations ? '=' + operations + '-no' : ''),
			),
		}
	},
})
