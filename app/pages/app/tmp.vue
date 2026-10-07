<script setup lang="ts">
import type { FileObject } from '@supabase/storage-js'
import type { TabsItem } from '@nuxt/ui'
import {
	TMP_MAX_FILE_SIZE,
	formatTmpSize,
	getTmpFilename,
} from '~/utils/tmpStorage'

const {
	uid,
	files,
	loading,
	busy,
	listError,
	refresh,
	upload,
	download,
	previewText,
	remove,
} = useTmpStorage()
const localePath = useLocalePath()
const redirect = useSupabaseCookieRedirect()
const route = useRoute()
const toast = useToast()
const ready = ref(false)
const selectedFiles = ref<File[] | null>(null)
const textName = ref('')
const textContent = ref('')
const search = ref('')
const deleteTarget = ref<FileObject | null>(null)
const deleteOpen = ref(false)
const previewOpen = ref(false)
const previewName = ref('')
const previewContent = ref('')
const copying = ref(false)
let accountVersion = 0

const tabs: TabsItem[] = [
	{ label: '上传文件', icon: 'i-lucide-upload', slot: 'files' },
	{ label: '粘贴文本', icon: 'i-lucide-text-cursor-input', slot: 'text' },
]
const filteredFiles = computed(() =>
	files.value.filter(file =>
		getTmpFilename(file.name)
			.toLocaleLowerCase()
			.includes(search.value.toLocaleLowerCase()),
	),
)
const totalSize = computed(() =>
	files.value.reduce((total, file) => total + (file.metadata?.size ?? 0), 0),
)
const textSize = computed(
	() => new TextEncoder().encode(textContent.value).byteLength,
)
const canSaveText = computed(
	() =>
		textContent.value.trim().length > 0 && textSize.value <= TMP_MAX_FILE_SIZE,
)

onMounted(() => {
	ready.value = true
})

watch(
	uid,
	() => {
		accountVersion++
		selectedFiles.value = null
		textName.value = ''
		textContent.value = ''
		search.value = ''
		deleteOpen.value = false
		deleteTarget.value = null
		previewOpen.value = false
		previewContent.value = ''
		previewName.value = ''
	},
	{ flush: 'sync' },
)

function isText(file: FileObject) {
	return (
		file.metadata?.mimetype?.startsWith('text/plain') ||
		/\.txt$/i.test(getTmpFilename(file.name))
	)
}

function saveLoginRedirect() {
	redirect.path.value = route.fullPath
}

async function uploadFiles() {
	const version = accountVersion
	const selected = selectedFiles.value ?? []
	const uploaded = await upload(selected)
	if (version !== accountVersion) return
	selectedFiles.value = uid.value
		? selected.filter(file => !uploaded.includes(file))
		: null
}

async function saveText() {
	if (!canSaveText.value || busy.value) return
	const name =
		textName.value.trim() ||
		`文本-${new Date().toISOString().replaceAll(':', '-')}`
	const file = new File(
		[textContent.value],
		/\.txt$/i.test(name) ? name : `${name}.txt`,
		{ type: 'text/plain;charset=utf-8' },
	)
	const saved = await upload([file])
	if (saved.length) {
		textName.value = ''
		textContent.value = ''
	}
}

async function openText(file: FileObject) {
	const version = accountVersion
	const text = await previewText(file)
	if (text === null || version !== accountVersion) return
	previewName.value = getTmpFilename(file.name)
	previewContent.value = text
	previewOpen.value = true
}

async function copyText() {
	copying.value = true
	try {
		await navigator.clipboard.writeText(previewContent.value)
		toast.add({ title: '已复制文本', color: 'success' })
	} catch {
		toast.add({
			title: '复制失败',
			description: '请选中预览中的文本并手动复制。',
			color: 'error',
		})
	} finally {
		copying.value = false
	}
}

async function confirmDelete() {
	if (deleteTarget.value && (await remove(deleteTarget.value))) {
		deleteOpen.value = false
		deleteTarget.value = null
	}
}

function requestDelete(file: FileObject) {
	deleteTarget.value = file
	deleteOpen.value = true
}

function closePreview() {
	previewOpen.value = false
}

function cancelDelete() {
	deleteOpen.value = false
}
</script>

<template>
	<UPage>
		<UPageHeader
			title="临时收纳"
			description="文件、片段、随手记。给暂时需要的内容一个落脚处。"
		>
			<template #links>
				<UBadge
					icon="i-lucide-lock-keyhole"
					color="neutral"
					variant="subtle"
					size="lg"
					label="仅自己可见"
				/>
			</template>
		</UPageHeader>
		<UPageBody class="space-y-8">
			<USkeleton v-if="!ready" class="h-64 w-full rounded-xl" />
			<UEmpty
				v-else-if="!uid"
				icon="i-lucide-lock-keyhole"
				title="登录后，开启你的临时空间"
				description="上传的文件和保存的文本只对你可见。"
			>
				<template #actions>
					<UButton
						:to="localePath('/login')"
						label="登录"
						icon="i-lucide-log-in"
						@click="saveLoginRedirect"
					/>
				</template>
			</UEmpty>
			<template v-else>
				<div
					class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]"
				>
					<section aria-label="添加内容" class="min-w-0 space-y-5">
						<div class="flex items-center gap-3">
							<span
								class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
							>
								<UIcon name="i-lucide-plus" class="size-5" />
							</span>
							<h2 class="text-lg font-semibold text-highlighted">放入新内容</h2>
						</div>
						<UTabs
							:items="tabs"
							:unmount-on-hide="false"
							:ui="{ content: 'pt-4' }"
						>
							<template #files>
								<div class="space-y-4">
									<UFormField label="选择文件" name="files">
										<UFileUpload
											v-model="selectedFiles"
											multiple
											:disabled="busy"
											:file-image="false"
											icon="i-lucide-cloud-upload"
											label="拖放文件到这里"
											description="或点击选择文件 · 每个文件最多 50 MB"
											:ui="{ base: 'min-h-48', wrapper: 'py-8' }"
										/>
									</UFormField>
									<div
										class="flex flex-wrap items-center justify-between gap-3"
									>
										<p class="text-sm text-muted">
											{{
												selectedFiles?.length
													? `已选择 ${selectedFiles.length} 个文件`
													: '支持一次上传多个文件'
											}}
										</p>
										<UButton
											label="上传文件"
											icon="i-lucide-upload"
											:loading="busy"
											:disabled="!selectedFiles?.length || busy"
											@click="uploadFiles"
										/>
									</div>
								</div>
							</template>
							<template #text>
								<form class="space-y-4" @submit.prevent="saveText">
									<UFormField label="文件名" name="textName" hint="可选">
										<UInput
											v-model="textName"
											:disabled="busy"
											:maxlength="200"
											placeholder="给这段文字起个名字"
											class="w-full"
										/>
									</UFormField>
									<UFormField
										label="纯文本"
										name="textContent"
										:error="
											textSize > TMP_MAX_FILE_SIZE
												? '文本不能超过 50 MB。'
												: undefined
										"
									>
										<UTextarea
											v-model="textContent"
											:disabled="busy"
											:rows="9"
											placeholder="在这里输入或粘贴文字…"
											class="w-full"
											:ui="{ base: 'font-mono leading-relaxed' }"
										/>
									</UFormField>
									<div
										class="flex flex-wrap items-center justify-between gap-3"
									>
										<p class="text-sm text-muted">
											保存为 .txt · {{ formatTmpSize(textSize) }}
										</p>
										<UButton
											type="submit"
											label="保存文本"
											icon="i-lucide-save"
											:loading="busy"
											:disabled="!canSaveText || busy"
										/>
									</div>
								</form>
							</template>
						</UTabs>
						<p
							class="flex items-start gap-2 text-sm leading-relaxed text-muted"
						>
							<UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" />
							内容会保留到你手动删除。用完后，记得清理一下。
						</p>
					</section>

					<section
						aria-labelledby="tmp-files-title"
						class="min-w-0 space-y-5 lg:border-l lg:border-default lg:pl-8"
					>
						<div class="flex items-center justify-between gap-3">
							<div>
								<h2
									id="tmp-files-title"
									class="text-lg font-semibold text-highlighted"
								>
									我的内容
								</h2>
								<p class="mt-1 text-sm text-muted">
									{{ files.length }} 个文件 · {{ formatTmpSize(totalSize) }}
								</p>
							</div>
							<UButton
								icon="i-lucide-refresh-cw"
								aria-label="刷新文件列表"
								color="neutral"
								variant="ghost"
								:loading="loading"
								:disabled="busy || loading"
								@click="refresh"
							/>
						</div>
						<UInput
							v-model="search"
							icon="i-lucide-search"
							aria-label="搜索文件名"
							placeholder="搜索文件名…"
							class="w-full"
						/>
						<UAlert
							v-if="listError"
							color="error"
							variant="soft"
							icon="i-lucide-circle-alert"
							title="暂时无法加载内容"
							:description="listError"
							:actions="[
								{
									label: '重试',
									color: 'error',
									variant: 'outline',
									onClick: refresh,
								},
							]"
						/>
						<div
							v-else-if="loading"
							class="space-y-3"
							aria-label="正在加载文件"
							aria-busy="true"
						>
							<USkeleton
								v-for="index in 3"
								:key="index"
								class="h-20 w-full rounded-lg"
							/>
						</div>
						<UEmpty
							v-else-if="!files.length"
							icon="i-lucide-folder-open"
							title="这里还空着"
							description="上传一个文件，或保存一段文字，它就会出现在这里。"
						/>
						<UEmpty
							v-else-if="!filteredFiles.length"
							icon="i-lucide-search"
							title="没有找到匹配的文件"
							description="试试其他关键词。"
						/>
						<ul v-else class="divide-y divide-default">
							<li
								v-for="file in filteredFiles"
								:key="file.id!"
								class="flex items-start gap-3 py-4 first:pt-0"
							>
								<div
									class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted"
								>
									<UIcon
										:name="
											isText(file) ? 'i-lucide-file-text' : 'i-lucide-file'
										"
										class="size-5"
									/>
								</div>
								<div class="min-w-0 flex-1 space-y-2">
									<p class="break-all text-sm font-medium text-highlighted">
										{{ getTmpFilename(file.name) }}
									</p>
									<p class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
										<span>{{ formatTmpSize(file.metadata?.size ?? 0) }}</span>
										<DateTime
											v-if="file.created_at"
											:value="file.created_at"
											:format="{ dateStyle: 'medium', timeStyle: 'short' }"
										/>
									</p>
									<div class="flex flex-wrap gap-1">
										<UButton
											v-if="isText(file)"
											label="查看文本"
											icon="i-lucide-eye"
											color="neutral"
											variant="ghost"
											size="sm"
											:disabled="busy"
											@click="openText(file)"
										/>
										<UButton
											label="下载"
											icon="i-lucide-download"
											color="neutral"
											variant="ghost"
											size="sm"
											:disabled="busy"
											@click="download(file)"
										/>
										<UButton
											label="删除"
											icon="i-lucide-trash-2"
											color="error"
											variant="ghost"
											size="sm"
											:disabled="busy"
											@click="requestDelete(file)"
										/>
									</div>
								</div>
							</li>
						</ul>
					</section>
				</div>
			</template>
		</UPageBody>

		<UModal
			v-model:open="previewOpen"
			:title="previewName"
			description="纯文本预览"
			:ui="{ content: 'sm:max-w-2xl' }"
		>
			<template #body>
				<pre
					class="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-elevated p-4 font-mono text-sm leading-relaxed text-default"
					>{{ previewContent }}</pre
				>
			</template>
			<template #footer>
				<UButton
					label="复制文本"
					icon="i-lucide-copy"
					:loading="copying"
					@click="copyText"
				/>
				<UButton
					label="关闭"
					color="neutral"
					variant="outline"
					@click="closePreview"
				/>
			</template>
		</UModal>
		<UModal
			v-model:open="deleteOpen"
			title="删除这份内容？"
			:description="
				deleteTarget
					? `「${getTmpFilename(deleteTarget.name)}」将被永久删除，无法恢复。`
					: ''
			"
			:dismissible="!busy"
			:close="!busy"
		>
			<template #footer>
				<UButton
					label="取消"
					color="neutral"
					variant="outline"
					:disabled="busy"
					@click="cancelDelete"
				/>
				<UButton
					label="删除"
					icon="i-lucide-trash-2"
					color="error"
					:loading="busy"
					:disabled="busy"
					@click="confirmDelete"
				/>
			</template>
		</UModal>
	</UPage>
</template>
