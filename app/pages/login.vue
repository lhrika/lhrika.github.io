<script setup lang="ts">
import * as z from 'zod/v4'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

// Localization
const { t } = useI18n({
	useScope: 'local',
})

// Nuxt UI composables
const toast = useToast()

// Auth form fields definitions
const fields: AuthFormField[] = [
	{
		name: 'email',
		type: 'email',
		label: t('emailLabel'),
		placeholder: 'Enter your email',
		required: true,
	},
	{
		name: 'password',
		label: t('passwordLabel'),
		type: 'password',
		placeholder: 'Enter your password',
		required: true,
	},
]

// Form schema definition
const schema = z.object({
	email: z.email('Invalid email'),
	password: z
		.string('Password is required')
		.min(8, 'Must be at least 8 characters'),
})
type Schema = z.output<typeof schema>

// Supabase client
const supabase = useSupabaseClient()

// Log in status
const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')

// Redirect info
const redirect = useSupabaseCookieRedirect()

// Log in logic
const signInWithPassword = async (email: string, password: string) => {
	const { error } = await supabase.auth.signInWithPassword({
		email: email,
		password: password,
	})
	if (error) {
		status.value = 'error'
		toast.add({
			title: t('errorTitle'),
			description: t('errorDescription'),
			color: 'error',
		})
	} else {
		status.value = 'success'
		toast.add({
			title: t('successTitle'),
			description: t('sucessDescription'),
			color: 'success',
		})
	}
}

// Redirect when the user changes
const user = useSupabaseUser()
watch(
	user,
	() => {
		navigateTo(redirect.path ? redirect.pluck() : '/')
	},
	{
		once: true,
	},
)

// Form submit event handler
const onSubmit = (payload: FormSubmitEvent<Schema>) => {
	if (status.value !== 'pending') {
		status.value = 'pending'
		signInWithPassword(payload.data.email, payload.data.password)
	}
}
</script>

<template>
	<UPage>
		<UPageBody>
			<UContainer>
				<UPageCard class="max-w-md mx-auto">
					<UAuthForm
						:schema="schema"
						:fields="fields"
						title="Welcome back!"
						icon="i-lucide-lock"
						:submit="{
							color:
								status === 'idle' || status === 'pending' ? 'primary' : status,
							loading: status === 'pending',
						}"
						@submit="onSubmit"
					>
						<template #description>
							Don't have an account?
							<ULink to="#" class="text-primary font-medium">Sign up</ULink>.
						</template>
						<template #password-hint>
							<ULink to="#" class="text-primary font-medium" tabindex="-1"
								>Forgot password?</ULink
							>
						</template>
						<template #validation>
							<UAlert
								v-if="status === 'error'"
								color="error"
								icon="i-lucide-info"
								title="Error signing in"
							/>
						</template>
						<template #footer>
							By signing in, you agree to our
							<ULink to="#" class="text-primary font-medium"
								>Terms of Service</ULink
							>.
						</template>
					</UAuthForm>
				</UPageCard>
			</UContainer>
		</UPageBody>
	</UPage>
</template>

<i18n lang="json">
{
	"en": {
		"loginTitle": "Login",
		"emailLabel": "Email",
		"passwordLabel": "Password",
		"submitButton": "Login",
		"successTitle": "Success",
		"successDescription": "Logged in successfully",
		"errorTitle": "Error",
		"errorDescription": "Login failed"
	},
	"zh": {
		"loginTitle": "登陆",
		"emailLabel": "邮箱",
		"passwordLabel": "密码",
		"submitButton": "登陆",
		"successTitle": "成功",
		"successDescription": "登陆成功",
		"errorTitle": "错误",
		"errorDescription": "登陆失败"
	},
	"ja": {
		"loginTitle": "ログイン",
		"emailLabel": "メールアドレス",
		"passwordLabel": "パスワード",
		"submitButton": "ログイン",
		"successTitle": "成功",
		"successDescription": "正常にログインしました",
		"errorTitle": "エラー",
		"errorDescription": "ログインに失敗しました"
	},
	"vi": {
		"loginTitle": "Đăng nhập",
		"emailLabel": "Email",
		"passwordLabel": "Mật khẩu",
		"submitButton": "Đăng nhập",
		"successTitle": "Thành công",
		"successDescription": "Đăng nhập thành công",
		"errorTitle": "Lỗi",
		"errorDescription": "Đăng nhập thất bại"
	}
}
</i18n>
