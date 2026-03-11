<template>
	<UPageCard>
		<UForm
			:schema="schema"
			:state="state"
			class="w-full space-y-4"
			@submit="handleSubmitMessage"
		>
			<UFormField name="name" :label="t('Name')">
				<UInput v-model="state.name" class="w-full" />
			</UFormField>
			<UFormField name="content" :label="t('Message')">
				<UTextarea v-model="state.content" class="w-full" />
			</UFormField>
			<div class="flex flex-col sm:flex-row items-center gap-4 justify-between">
				<ClientOnly>
					<NuxtTurnstile
						v-model="token"
						:options="{
							appearance: 'interaction-only',
							size: 'flexible',
						}"
					/>
				</ClientOnly>
				<UButton
					type="submit"
					color="primary"
					class="w-full max-w-sm justify-center"
				>
					{{ t('Submit') }}
				</UButton>
			</div>
		</UForm>
	</UPageCard>
</template>

<script setup lang="ts">
import { z } from 'zod/v4'

const toast = useToast()
const { t } = useI18n({
	useScope: 'local',
})

const schema = z.object({
	name: z.string(t('Name is required.')).nonempty(t('Name is required.')),
	content: z
		.string(t('Message is required.'))
		.nonempty(t('Message is required.')),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
	name: undefined,
	content: undefined,
})

// Cloudflare turnstile token
const token = ref('')

const supabase = useSupabaseClient()

const handleSubmitMessage = async () => {
	const { error } = await supabase.functions.invoke('submit-message', {
		body: {
			token: token.value,
			content: state.content,
			name: state.name,
		},
	})
	if (error) {
		toast.add({
			title: 'Error',
			description: error.message,
			color: 'error',
		})
	} else {
		toast.add({
			title: 'Success',
			description: 'Message submitted successfully!',
			color: 'success',
		})
	}
}
</script>

<i18n lang="json">
{
	"zh": {
		"Name is required.": "昵称不能为空。",
		"Message is required.": "留言不能为空。",
		"Submit": "提交",
		"Name": "昵称",
		"Message": "留言",
		"Message Board": "留言板"
	},
	"ja": {
		"Name is required.": "名前は必須です。",
		"Message is required.": "メッセージは必須です。",
		"Submit": "送信",
		"Name": "名前",
		"Message": "メッセージ",
		"Message Board": "メッセージボード"
	},
	"en": {
		"Name is required.": "Name is required.",
		"Message is required.": "Message is required.",
		"Submit": "Submit",
		"Name": "Name",
		"Message": "Message",
		"Message Board": "Message Board"
	},
	"vi": {
		"Name is required.": "Tên là bắt buộc.",
		"Message is required.": "Tin nhắn là bắt buộc.",
		"Submit": "Gửi",
		"Name": "Tên",
		"Message": "Tin nhắn",
		"Message Board": "Bảng tin nhắn"
	}
}
</i18n>
