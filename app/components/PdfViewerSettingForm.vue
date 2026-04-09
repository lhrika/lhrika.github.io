<script setup lang="ts">
import * as z from 'zod/v4'

const emit = defineEmits<{ adjustScale: []; submit: [] }>()
const { hasSubmitButton } = defineProps<{
	hasSubmitButton?: boolean
}>()

const formRef = useTemplateRef('form')

const store = usePDFStore()
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
const state = reactive<Schema>({
	cropX: store.cropX,
	cropY: store.cropY,
	cropWidth: store.cropWidth,
	cropHeight: store.cropHeight,
	cropMarginX: store.cropMarginX,
	cropMarginY: store.cropMarginY,
	autoCrop: store.autoCrop,
	sectionHeight: store.sectionHeight,
	scale: store.scale,
	margin: store.margin,
})

store.$subscribe(mutation => {
	if (mutation.type === 'direct') {
		state.cropX = store.cropX
		state.cropWidth = store.cropWidth
	}
})

const onSubmit = () => {
	store.$patch({ ...state })
	emit('submit')
}
const adjustScale = (width: number) => {
	state.scale = width / state.cropWidth
}
const submit = () => {
	formRef.value?.submit()
}
defineExpose({
	adjustScale,
	submit,
})
</script>

<template>
	<UForm
		ref="form"
		:state="state"
		:schema="schema"
		class="space-y-4"
		@submit="onSubmit"
	>
		<USwitch v-model="state.autoCrop" label="Auto Crop" />
		<UFormField
			v-if="state.autoCrop"
			label="Auto crop margin"
			name="cropMarginX"
		>
			<UInputNumber v-model="state.cropMarginX" />
		</UFormField>
		<div v-else class="flex gap-2">
			<UFormField label="Crop X" name="cropX">
				<UInputNumber v-model="state.cropX" class="flex-1" />
			</UFormField>
			<UFormField label="Crop Width" name="cropWidth">
				<UInputNumber v-model="state.cropWidth" class="flex-1" />
			</UFormField>
		</div>
		<div class="flex gap-2">
			<UFormField label="Section Height" name="numSections">
				<UInputNumber v-model="state.sectionHeight" />
			</UFormField>
			<UFormField label="Top/Bottom Margin" name="margin">
				<UInputNumber v-model="state.margin" />
			</UFormField>
		</div>
		<UFormField label="Scale" name="scale" orientation="horizontal">
			<UFieldGroup>
				<UInputNumber v-model="state.scale" :step="0.1" />
				<UButton
					label="Auto"
					color="neutral"
					variant="outline"
					@click="emit('adjustScale')"
				/>
			</UFieldGroup>
		</UFormField>
		<UButton
			v-if="hasSubmitButton"
			type="submit"
			label="Submit"
			class="w-full"
		/>
	</UForm>
</template>
