<script setup lang="ts">
import { z } from 'zod/v4'

const { t } = useI18n({
	useScope: 'local',
})

const schema = z.object({
	email: z.email('Invalid email'),
	password: z
		.string('Password is required')
		.min(8, 'Must be at least 8 characters'),
})
type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({
	email: undefined,
	password: undefined,
})
const toast = useToast()

const supabase = useSupabaseClient()

const signInWithPassword = async () => {
	const { error } = await supabase.auth.signInWithPassword({
		email: state.email!,
		password: state.password!,
	})
	if (error) {
		toast.add({
			title: t('errorTitle'),
			description: t('errorDescription'),
			color: 'error',
		})
	} else {
		toast.add({
			title: t('successTitle'),
			description: t('sucessDescription'),
			color: 'success',
		})
	}
	const route = useRoute()
	setTimeout(() => {
		const redirect = route.query.redirect as string | undefined
		navigateTo(redirect && !redirect.startsWith('/login') ? redirect : '/')
	}, 1000)
}
</script>

<template>
	<div class="flex justify-center">
		<UForm
			:schema="schema"
			:state="state"
			class="space-y-4"
			@submit="signInWithPassword"
		>
			<UFormField :label="t('emailLabel')" name="email">
				<UInput v-model="state.email" />
			</UFormField>
			<UFormField :label="t('passwordLabel')" name="password">
				<UInput v-model="state.password" type="password" />
			</UFormField>
			<UButton type="submit">
				{{ t('submitButton') }}
			</UButton>
		</UForm>
	</div>
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
