const themeColors = [
	'primary',
	'secondary',
	'success',
	'info',
	'warning',
	'error',
	'neutral',
]
export default defineAppConfig({
	ui: {
		colors: {
			primary: 'cornflowerblue',
			secondary: 'lime',
			success: 'emerald',
			danger: 'red',
			info: 'sky',
			warning: 'orange',
			neutral: 'slate',
		},
		button: {
			slots: {
				base: 'justify-center',
			},
		},
		inputNumber: {
			variants: {
				variant: {
					underline: 'rounded-none border-b focus-visible:outline-0',
				},
			},
			compoundVariants: [
				...themeColors.map(color => ({
					color,
					variant: 'underline',
					class: `focus-visible:border-b-2 focus-visible:border-${color} border-${color}`,
				})),
				...themeColors.map(color => ({
					color,
					highlight: true,
					variant: 'underline',
					class: `ring-0 border-${color}`,
				})),
			],
		},
		pageHeader: {
			slots: {
				root: 'py-0 px-4 sm:px-6 lg:px-8 border-0',
				container: 'border-b border-default py-8',
			},
		},
	},
})
