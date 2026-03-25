<template>
	<UPage>
		<UPageHeader title="Diary" />
		<UPageBody>
			<UContainer class="max-w-80">
				<UCalendar v-model="date" :locale="locale" />
			</UContainer>
			<UContainer>
				<UTabs v-model="activeTab" :items="tabItems">
					<template #preview>
						<MDC :value="diaryContent" class="px-2" />
					</template>
					<template #edit>
						<UForm
							:schema="schema"
							:state="state"
							class="space-y-4"
							@submit="onSubmit"
						>
							<UFormField
								name="content"
								label="Content"
								:ui="{
									labelWrapper: 'hidden',
								}"
							>
								<UTextarea
									ref="textarea"
									v-model="state.content"
									class="w-full"
									:ui="{
										base: 'max-h-80',
									}"
								/>
							</UFormField>
							<div class="flex justify-end">
								<UButton type="submit" label="Submit" />
							</div>
						</UForm>
					</template>
				</UTabs>
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
import type { FormSubmitEvent, TabsItem } from '@nuxt/ui'
import { getLocalTimeZone, today } from '@internationalized/date'
import * as z from 'zod/v4'

// Locale to format calendar
const { locale } = useI18n()

// Displaying diary content
const diaryContent = ref('')

// Tab items
const tabItems = computed(
	() =>
		[
			{
				label: 'Preview',
				slot: 'preview',
				value: 'preview',
				disabled: !diaryContent.value,
			},
			{
				label: 'Edit',
				value: 'edit',
				slot: 'edit',
			},
		] satisfies TabsItem[],
)

// Active tab
const activeTab = ref<'preview' | 'edit'>('preview')

// Seleceted Date
const date = shallowRef(today(getLocalTimeZone()))

// Supabase
const supabase = useSupabaseClient()

const updateDiaryContent = async () => {
	const { data } = await supabase
		.from('diary')
		.select('id,content')
		.eq('date', date.value.toString())
		.maybeSingle()
	if (data) {
		diaryContent.value = data.content
		state.content = data.content
		state.id = data.id
	} else {
		diaryContent.value = ''
		state.content = ''
		state.id = undefined
		activeTab.value = 'edit'
	}
}

watch(date, () => {
	updateDiaryContent()
})

// Form schema
const schema = z.object({
	id: z.number().positive().optional(),
	content: z.string().nonempty(),
})
type Schema = z.output<typeof schema>

// Form state
const state = reactive<Partial<Schema>>({
	content: '',
})

// Form submit event handler
const onSubmit = async (e: FormSubmitEvent<Schema>) => {
	const content = e.data.content
	const response = await supabase
		.from('diary')
		.upsert({
			id: state.id,
			content,
			date: date.value.toString(),
		})
		.select('id,content')
		.maybeSingle()
	if (response.data) {
		diaryContent.value = response.data.content
		state.id = response.data.id
		activeTab.value = 'preview'
	}
}

// Resize textarea on content change
const textareaRef = useTemplateRef('textarea')
watch(
	() => state.content,
	() => {
		const textarea = textareaRef.value?.textareaRef
		if (textarea) {
			textarea.style.height = 'auto'
			textarea.style.height = `${textarea.scrollHeight}px`
		}
	},
)

onMounted(() => {
	updateDiaryContent()
})
</script>
