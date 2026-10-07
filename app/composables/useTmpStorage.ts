import type { FileObject } from '@supabase/storage-js'
import {
	TMP_BUCKET,
	TMP_MAX_FILE_SIZE,
	TMP_MAX_PREVIEW_SIZE,
	createTmpObjectName,
	getTmpFilename,
} from '~/utils/tmpStorage'

export function useTmpStorage() {
	const supabase = useSupabaseClient()
	const user = useSupabaseUser()
	const toast = useToast()
	const uid = computed(() => user.value?.sub ?? '')
	const files = ref<FileObject[]>([])
	const loading = ref(false)
	const busy = ref(false)
	const listError = ref('')
	let listRequest = 0
	let accountVersion = 0

	function showError(title: string, error: unknown) {
		toast.add({
			title,
			description: error instanceof Error ? error.message : '请稍后重试。',
			color: 'error',
		})
	}

	async function refresh() {
		const owner = uid.value
		const request = ++listRequest
		if (!owner) return
		loading.value = true
		listError.value = ''
		try {
			const result: FileObject[] = []
			const limit = 100
			for (let offset = 0; ; offset += limit) {
				const { data, error } = await supabase.storage
					.from(TMP_BUCKET)
					.list(owner, {
						limit,
						offset,
						sortBy: { column: 'name', order: 'asc' },
					})
				if (request !== listRequest || owner !== uid.value) return
				if (error) throw error
				result.push(...data.filter(file => file.id !== null))
				if (data.length < limit) break
			}
			files.value = result.sort((a, b) =>
				(b.created_at ?? '').localeCompare(a.created_at ?? ''),
			)
		} catch (error) {
			if (request === listRequest) {
				listError.value =
					error instanceof Error ? error.message : '文件列表加载失败。'
			}
		} finally {
			if (request === listRequest) loading.value = false
		}
	}

	// Clear private state immediately on logout/account changes. Discard stale responses.
	watch(
		uid,
		() => {
			accountVersion++
			listRequest++
			files.value = []
			listError.value = ''
			loading.value = false
			if (import.meta.client && uid.value) void refresh()
		},
		{ immediate: true, flush: 'sync' },
	)
	onScopeDispose(() => {
		accountVersion++
		listRequest++
	})

	async function upload(input: File[]) {
		const owner = uid.value
		const version = accountVersion
		if (!owner || busy.value) return []
		busy.value = true
		const uploaded: File[] = []
		try {
			for (const file of input) {
				if (owner !== uid.value || version !== accountVersion) break
				if (file.size > TMP_MAX_FILE_SIZE) {
					showError('文件过大', new Error(`${file.name} 超过了 50 MB。`))
					continue
				}
				try {
					const path = `${owner}/${createTmpObjectName(file.name)}`
					const { error } = await supabase.storage
						.from(TMP_BUCKET)
						.upload(path, file, {
							contentType: file.type || 'application/octet-stream',
							cacheControl: '0',
							upsert: false,
						})
					if (version !== accountVersion) break
					if (error) throw error
					uploaded.push(file)
				} catch (error) {
					if (version === accountVersion)
						showError(`上传失败：${file.name}`, error)
				}
			}
			if (uploaded.length && version === accountVersion) {
				toast.add({
					title: `已保存 ${uploaded.length} 个文件`,
					color: 'success',
				})
				await refresh()
			}
		} finally {
			busy.value = false
		}
		return version === accountVersion ? uploaded : []
	}

	async function read(file: FileObject) {
		const owner = uid.value
		const version = accountVersion
		if (!owner || !files.value.some(item => item.id === file.id)) {
			throw new Error('请登录后访问自己的文件。')
		}
		const { data, error } = await supabase.storage
			.from(TMP_BUCKET)
			.download(`${owner}/${file.name}`)
		if (error) throw error
		if (version !== accountVersion)
			throw new Error('登录状态已变更，请重新打开文件。')
		return data
	}

	async function download(file: FileObject) {
		if (busy.value) return
		busy.value = true
		try {
			const blob = await read(file)
			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = getTmpFilename(file.name)
			document.body.append(link)
			link.click()
			link.remove()
			setTimeout(() => URL.revokeObjectURL(url), 1000)
		} catch (error) {
			showError('下载失败', error)
		} finally {
			busy.value = false
		}
	}

	async function previewText(file: FileObject) {
		if (busy.value) return null
		busy.value = true
		const version = accountVersion
		try {
			if ((file.metadata?.size ?? 0) > TMP_MAX_PREVIEW_SIZE) {
				throw new Error('文本超过 1 MB，请下载后查看。')
			}
			const blob = await read(file)
			if (blob.size > TMP_MAX_PREVIEW_SIZE)
				throw new Error('文本超过 1 MB，请下载后查看。')
			const text = await blob.text()
			return version === accountVersion ? text : null
		} catch (error) {
			if (version === accountVersion) showError('无法预览文本', error)
			return null
		} finally {
			busy.value = false
		}
	}

	async function remove(file: FileObject) {
		const owner = uid.value
		const version = accountVersion
		if (!owner || busy.value || !files.value.some(item => item.id === file.id))
			return false
		busy.value = true
		try {
			const { data, error } = await supabase.storage
				.from(TMP_BUCKET)
				.remove([`${owner}/${file.name}`])
			if (version !== accountVersion) return false
			if (error) throw error
			if (!data.length) throw new Error('文件未删除，请刷新列表后重试。')
			toast.add({ title: '已删除文件', color: 'success' })
			await refresh()
			return true
		} catch (error) {
			if (version === accountVersion) showError('删除失败', error)
			return false
		} finally {
			busy.value = false
		}
	}

	return {
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
	}
}
