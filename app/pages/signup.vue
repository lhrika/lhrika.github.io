<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod/v4'

// Nuxt UI composables
const toast = useToast()

// Auth form ref
const form = useTemplateRef('authForm')

// Status
const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')

// Auth form fields definition
const fields: AuthFormField[] = [
	{
		label: 'Name',
		type: 'text',
		name: 'name',
		required: true,
	},
	{
		label: 'Avatar',
		description: 'URL to your avatar image. Preview at the top of the form',
		type: 'url',
		name: 'avatar',
	},
	{
		label: 'Email',
		type: 'email',
		name: 'email',
		required: true,
	},
	{
		label: 'Password',
		type: 'password',
		name: 'password',
		required: true,
	},
	{
		label: 'Invite Code',
		type: 'text',
		name: 'inviteCode',
		required: true,
	},
]

// Form schema definition
const schema = z.object({
	name: z.string().nonempty(),
	avatar: z.url().optional(),
	email: z.email(),
	password: z.string().min(8),
	inviteCode: z.string(),
})
type Schema = z.output<typeof schema>

// Supabase client
const supabase = useSupabaseClient()

// Sign up logic
const signUp = async (
	email: string,
	password: string,
	inviteCode: string,
	name: string,
	avatar?: string,
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
	if (!error && data && data.session) {
		status.value = 'success'
		toast.add({
			title: 'Successfully signed up',
			description: 'You will soon be redirected to the top page',
			color: 'success',
			duration: 3000,
			actions: [
				{
					label: 'Go to top',
					to: '/',
				},
			],
			'onUpdate:open': open => {
				if (!open) {
					navigateTo('/')
				}
			},
		})
		supabase.auth.setSession(data.session)
	} else {
		status.value = 'error'
		toast.add({
			title: 'Failed to sign up',
			description: 'Please make sure that your invite code is valid',
			color: 'error',
		})
	}
}

// Submit event handler
const onSubmit = (payload: FormSubmitEvent<Schema>) => {
	if (status.value !== 'pending') {
		status.value = 'pending'
		signUp(
			payload.data.email,
			payload.data.password,
			payload.data.inviteCode,
			payload.data.name,
			payload.data.avatar,
		)
	}
}
</script>
<template>
	<UPage>
		<UPageBody>
			<UContainer>
				<UPageCard class="max-w-xl mx-auto">
					<UAuthForm
						ref="authForm"
						:fields="fields"
						:schema="schema"
						:submit="{
							label: 'Sign Up',
							color:
								status === 'idle' || status === 'pending' ? 'primary' : status,
							loading: status === 'pending',
						}"
						:ui="{
							header: 'items-center',
						}"
						@submit="onSubmit"
					>
						<template #header>
							<Icon
								v-if="!form?.state.avatar"
								name="i-lucide-user"
								class="size-16"
							/>
							<NuxtImg
								v-else
								:src="form?.state.avatar"
								width="64"
								height="64"
								class="size-16 rounded-full"
							/>
						</template>
					</UAuthForm>
				</UPageCard>
			</UContainer>
		</UPageBody>
	</UPage>
</template>
