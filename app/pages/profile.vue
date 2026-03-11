<template>
	<UPage>
		<UContainer>
			<UPageHeader title="Profile" />
		</UContainer>
		<UPageBody>
			<UContainer>
				<UPageCard>
					<UAuthForm
						ref="authForm"
						:fields="fields"
						:schema="schema"
						:submit="{
							label: 'Update Profile',
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
						<template #avatar-field="{ state }">
							<UFieldGroup class="w-full">
								<UInput v-model="state.avatar" class="w-full" />
								<UButton
									variant="subtle"
									color="neutral"
									icon="i-lucide-x"
									@click="
										() => {
											state.avatar = undefined
										}
									"
								/>
							</UFieldGroup>
						</template>
					</UAuthForm>
				</UPageCard>
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<script setup lang="ts">
import type { AsyncDataRequestStatus } from '#app'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod/v4'

// Supabase client and user
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Form ref
const form = useTemplateRef('authForm')

// Init form state with user profile
onMounted(() => {
	if (form.value) {
		form.value.state.name = user.value?.profile.name
		form.value.state.avatar = user.value?.profile.avatar
		form.value.state.email = user.value?.email ?? ''
	}
})

// Request Status
const status = ref<AsyncDataRequestStatus>('idle')

// Auth form fields definition
const fields = ref<AuthFormField[]>([
	{
		label: 'Name',
		type: 'text',
		name: 'name',
		modelModifiers: {
			trim: true,
		},
	},
	{
		label: 'Avatar',
		description: 'URL to your avatar image. Preview at the top of the form',
		type: 'url',
		name: 'avatar',
		modelModifiers: {
			trim: true,
		},
	},
	{
		label: 'Email',
		type: 'email',
		name: 'email',
		disabled: true,
	},
	{
		label: 'Current Password',
		type: 'password',
		name: 'password',
	},
	{
		label: 'New Password',
		type: 'password',
		name: 'newPassword',
	},
])

// Form schema definition
const schema = z.object({
	name: z.string().nonempty(),
	avatar: z.url().optional(),
	email: z.email(),
	password: z.string().optional(),
	newPassword: z.string().optional(),
})
type Schema = z.output<typeof schema>

// Submit event handler
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
	status.value = 'pending'
	if (event.data.password && event.data.newPassword) {
		const { data: isPasswordCorrect } = await supabase.rpc('verify_password', {
			password: event.data.password,
		})
		if (!isPasswordCorrect) {
			status.value = 'error'
			form.value?.formRef?.setErrors(
				[
					{
						message: 'Current password is wrong!',
						name: 'password',
					},
				],
				'password',
			)
			return
		}
	}
	await supabase.auth
		.updateUser({
			password: event.data.newPassword,
			data: {
				name: event.data.name,
				avatar: event.data.avatar ?? null,
			},
		})
		.then(res => {
			if (!res.error) {
				status.value = 'success'
				if (form.value) {
					form.value.state.password = undefined
					form.value.state.newPassword = undefined
				}
				supabase.auth.refreshSession()
			} else {
				status.value = 'error'
			}
		})
}
</script>
