<template>
	<UForm
		:schema="schema"
		:state="state"
		class="flex flex-col items-end gap-2"
		@submit="onSubmit"
	>
		<UTextarea
			v-model.trim="state.content"
			:rows="2"
			icon="i-lucide-message-square-more"
			class="w-full"
		/>
		<UButton icon="i-lucide-send" label="Send" />
	</UForm>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod/v4'

// Form schema definition
const schema = z.object({
	content: z.string().nonempty(),
})
type Schema = z.output<typeof schema>

// Form state
const state = reactive<Partial<Schema>>({
	content: '',
})

// Supabase client
const supabase = useSupabaseClient()

// Submit event handler
const onSubmit = (event: FormSubmitEvent<Schema>) => {
	supabase
		.from('updates')
		.insert({
			content: event.data.content,
		})
		.then(res => {
			if (res.status >= 200 && res.status < 300) {
				state.content = ''
				refreshNuxtData('latest-updates')
			}
		})
}
</script>
