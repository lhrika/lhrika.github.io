<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod/v4'

// Auth form fields definition
const fields: AuthFormField[] = [
	{
		label: 'Name',
		type: 'text',
		name: 'name',
	},
	{
		label: 'Avatar',
		type: 'url',
		name: 'avatar',
	},
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
	name: z.string().nonempty(),
	avatar: z.url(),
	email: z.email(),
	password: z.string().min(8),
	inviteCode: z.string(),
})
type Schema = z.output<typeof schema>

// Supabase client
const supabase = useSupabaseClient()

// Sign up logic
const signUp = async (
	name: string,
	avatar: string,
	email: string,
	password: string,
	inviteCode: string,
) => {
	const { data, error } = await supabase.functions.invoke('signup', {
		body: {
			name: name,
			avatar: avatar,
			email: email,
			password: password,
			inviteCode: inviteCode,
		},
	})
	if (data && data.session) {
		supabase.auth.setSession(data.session)
	}
}

const user = useSupabaseUser()
watch(user, () => {
	console.log(user.value)
})

// Submit event handler
const onSubmit = (payload: FormSubmitEvent<Schema>) => {
	signUp(
		payload.data.name,
		payload.data.avatar,
		payload.data.email,
		payload.data.password,
		payload.data.inviteCode,
	)
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
