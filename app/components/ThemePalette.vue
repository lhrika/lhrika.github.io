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
					:items="semanticColorSelectItems"
					class="w-32 sm:w-48"
				/>
			</UFormField>
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
				<UButton
					v-for="color in themeColors"
					:key="color"
					variant="outline"
					color="neutral"
					size="sm"
					:class="{
						'bg-accented': appConfig.ui.colors[semanticColorName] === color,
					}"
					@click="setColor(color, semanticColorName)"
				>
					<span
						:class="`w-2 h-2 rounded-full inline-block bg-(--color-light) dark:bg-(--color-dark)`"
						:style="[
							`--color-light: var(--color-${color}-500)`,
							`--color-dark: var(--color-${color}-400)`,
						]"
					/>
					{{ titleCase(color) }}
				</UButton>
			</div>
		</template>
	</UPopover>
</template>
<script setup lang="ts">
import {
	themeColors,
	semanticColors,
	type SemanticColor,
	type ThemeColor,
} from '#shared/theme'
import type { SelectItem } from '@nuxt/ui'
import { titleCase } from 'text-case'

const appConfig = useAppConfig()

const semanticColorSelectItems: SelectItem[] = semanticColors.map(color => ({
	label: titleCase(color),
	value: color,
}))
const semanticColorName = ref<SemanticColor>('primary')

const setColor = (color: ThemeColor, name: SemanticColor) => {
	appConfig.ui.colors[name] = color
}
</script>
