<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod/v4'

// Auth form fields definition
const fields: AuthFormField[] = [
	{
		label: 'Email',
		type: 'email',
		name: 'email',
	},
	{
		label: 'Password',
		type: 'password',
		name: 'password',
	},
	{
		label: 'Invite Code',
		type: 'text',
		name: 'inviteCode',
	},
]

// Form schema definition
const schema = z.object({
	email: z.email(),
	password: z.string().min(8),
	inviteCode: z.string(),
})
type Schema = z.output<typeof schema>

// Submit event handler
const onSubmit = (payload: FormSubmitEvent<Schema>) => {
	console.log(payload)
}
</script>
<template>
	<UPage>
		<UPageBody>
			<UContainer>
				<UPageCard class="max-w-xl mx-auto">
					<UAuthForm :fields="fields" :schema="schema" @submit="onSubmit">
					</UAuthForm>
				</UPageCard>
			</UContainer>
		</UPageBody>
	</UPage>
</template>
