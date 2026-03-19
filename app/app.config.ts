const themeColors = [
	'primary',
	'secondary',
	'success',
	'info',
	'warning',
	'error',
]
export default defineAppConfig({
	ui: {
		colors: {
			primary: 'cyan',
			neutral: 'stone',
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
	},
})
