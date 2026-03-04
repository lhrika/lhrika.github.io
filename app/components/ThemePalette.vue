<template>
	<UPopover
		:ui="{
			content: 'p-4',
		}"
	>
		<UButton icon="i-lucide-palette" color="neutral" variant="ghost" />
		<template #content>
			<UFormField
				orientation="horizontal"
				label="选择要设置的颜色"
				class="mb-2"
			>
				<USelect
					v-model="semanticColorName"
					:items="semanticColors"
					class="w-32 sm:w-48"
				/>
			</UFormField>
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
				<UButton
					v-for="color in colors"
					:key="color.value"
					variant="outline"
					color="neutral"
					size="sm"
					:class="{
						'bg-accented':
							appConfig.ui.colors[semanticColorName] === color.value,
					}"
					@click="setColor(color.value, semanticColorName)"
				>
					<span
						:class="`w-2 h-2 rounded-full inline-block ${color.light} ${color.dark}`"
					/>
					{{ color.label }}
				</UButton>
			</div>
		</template>
	</UPopover>
</template>
<script setup lang="ts">
const appConfig = useAppConfig()
const colors = [
	{ label: 'Red', value: 'red', light: 'bg-red-500', dark: 'dark:bg-red-400' },
	{
		label: 'Orange',
		value: 'orange',
		light: 'bg-orange-500',
		dark: 'dark:bg-orange-400',
	},
	{
		label: 'Amber',
		value: 'amber',
		light: 'bg-amber-500',
		dark: 'dark:bg-amber-400',
	},
	{
		label: 'Yellow',
		value: 'yellow',
		light: 'bg-yellow-500',
		dark: 'dark:bg-yellow-400',
	},
	{
		label: 'Lime',
		value: 'lime',
		light: 'bg-lime-500',
		dark: 'dark:bg-lime-400',
	},
	{
		label: 'Green',
		value: 'green',
		light: 'bg-green-500',
		dark: 'dark:bg-green-400',
	},
	{
		label: 'Emerald',
		value: 'emerald',
		light: 'bg-emerald-500',
		dark: 'dark:bg-emerald-400',
	},
	{
		label: 'Teal',
		value: 'teal',
		light: 'bg-teal-500',
		dark: 'dark:bg-teal-400',
	},
	{
		label: 'Cyan',
		value: 'cyan',
		light: 'bg-cyan-500',
		dark: 'dark:bg-cyan-400',
	},
	{ label: 'Sky', value: 'sky', light: 'bg-sky-500', dark: 'dark:bg-sky-400' },
	{
		label: 'Blue',
		value: 'blue',
		light: 'bg-blue-500',
		dark: 'dark:bg-blue-400',
	},
	{
		label: 'Indigo',
		value: 'indigo',
		light: 'bg-indigo-500',
		dark: 'dark:bg-indigo-400',
	},
	{
		label: 'Violet',
		value: 'violet',
		light: 'bg-violet-500',
		dark: 'dark:bg-violet-400',
	},
	{
		label: 'Purple',
		value: 'purple',
		light: 'bg-purple-500',
		dark: 'dark:bg-purple-400',
	},
	{
		label: 'Fuchsia',
		value: 'fuchsia',
		light: 'bg-fuchsia-500',
		dark: 'dark:bg-fuchsia-400',
	},
	{
		label: 'Pink',
		value: 'pink',
		light: 'bg-pink-500',
		dark: 'dark:bg-pink-400',
	},
	{
		label: 'Rose',
		value: 'rose',
		light: 'bg-rose-500',
		dark: 'dark:bg-rose-400',
	},
	{
		label: 'Slate',
		value: 'slate',
		light: 'bg-slate-500',
		dark: 'dark:bg-slate-400',
	},
	{
		label: 'Gray',
		value: 'gray',
		light: 'bg-gray-500',
		dark: 'dark:bg-gray-400',
	},
	{
		label: 'Zinc',
		value: 'zinc',
		light: 'bg-zinc-500',
		dark: 'dark:bg-zinc-400',
	},
	{
		label: 'Neutral',
		value: 'neutral',
		light: 'bg-neutral-500',
		dark: 'dark:bg-neutral-400',
	},
	{
		label: 'Stone',
		value: 'stone',
		light: 'bg-stone-500',
		dark: 'dark:bg-stone-400',
	},
]
const semanticColors = [
	{ label: 'Primary', value: 'primary' },
	{ label: 'Secondary', value: 'secondary' },
	{ label: 'Success', value: 'success' },
	{ label: 'Info', value: 'info' },
	{ label: 'Warning', value: 'warning' },
	{ label: 'Error', value: 'error' },
	{ label: 'Neutral', value: 'neutral' },
]
const semanticColorName = ref<
	'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
>('primary')
const setColor = (
	color: string,
	name:
		| 'primary'
		| 'secondary'
		| 'success'
		| 'info'
		| 'warning'
		| 'error'
		| 'neutral',
) => {
	appConfig.ui.colors[name] = color
}
</script>
