<template>
	<UPage>
		<UPageHeader
			title="Google Photos Direct URL"
			description="Convert Google Photos share URL to direct URL"
		/>
		<UPageBody>
			<UContainer class="space-y-4">
				<UFormField label="Share URL">
					<UInput v-model="shareUrl" name="shareUrl" class="w-full">
						<template #trailing>
							<UKbd value="enter" />
						</template>
					</UInput>
				</UFormField>
				<UButton
					label="To direct URL"
					:loading="status === 'pending'"
					class="w-full max-w-sm justify-center flex mx-auto"
					@click="
						() => {
							refresh()
						}
					"
				/>
				<div
					v-if="status === 'success' && directUrl"
					class="text-wrap break-all relative group cursor-copy"
					@click="
						() => {
							copy(directUrl)
						}
					"
				>
					<div class="group-hover:opacity-70">
						{{ directUrl }}
					</div>
					<div
						class="absolute top-1/2 left-1/2 -translate-1/2 inline-flex justify-center items-center gap-2 font-bold opacity-0 group-hover:opacity-100 bg-default p-2 rounded-lg border-2 border-muted"
					>
						<Icon name="i-lucide-copy" class="size-5" />
						Copy
					</div>
				</div>
				<UButton
					v-if="status === 'success' && directUrl"
					label="Copy ID"
					class="w-full max-w-sm justify-center flex mx-auto"
					variant="outline"
					@click="
						() => {
							copy(
								(directUrl as string).replaceAll(
									'https://lh3.googleusercontent.com/',
									'',
								),
							)
						}
					"
				/>
			</UContainer>
		</UPageBody>
	</UPage>
</template>
<script setup lang="ts">
import * as z from 'zod/v4'
const supabase = useSupabaseClient()
const shareUrl = ref('')
const validator = z.url()
const parseResult = computed(() => {
	return validator.safeParse(shareUrl.value)
})
const {
	data: directUrl,
	refresh,
	status,
} = await useAsyncData(
	'google-photos-direct-url',
	async () => {
		if (parseResult.value.success) {
			return await supabase.functions.invoke('google-photos-direct', {
				body: {
					url: shareUrl.value,
				},
			})
		}
	},
	{
		transform: data => {
			if (!data?.error) {
				return data?.data
			}
		},
	},
)

defineShortcuts({
	enter: {
		usingInput: 'shareUrl',
		handler() {
			refresh()
		},
	},
})

const copy = (value: string) => {
	navigator.clipboard.writeText(value).then(
		() => {
			/* clipboard successfully set */
		},
		() => {
			/* clipboard write failed */
		},
	)
}
</script>
