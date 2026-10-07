export const TMP_BUCKET = 'tmp'
export const TMP_MAX_FILE_SIZE = 50 * 1024 * 1024
export const TMP_MAX_PREVIEW_SIZE = 1024 * 1024

// ASCII object keys also support names containing Unicode, slashes or emoji.
export function createTmpObjectName(filename: string) {
	const bytes = new TextEncoder().encode(filename)
	const encoded = btoa(
		Array.from(bytes, byte => String.fromCharCode(byte)).join(''),
	)
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/, '')
	return `${crypto.randomUUID()}__${encoded}`
}

export function getTmpFilename(objectName: string) {
	const match = objectName.match(/^[0-9a-f-]{36}__([A-Za-z0-9_-]+)$/i)
	if (!match?.[1]) return objectName
	try {
		const encoded = match[1].replaceAll('-', '+').replaceAll('_', '/')
		const bytes = Uint8Array.from(atob(encoded), character =>
			character.charCodeAt(0),
		)
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
	} catch {
		return objectName
	}
}

export function formatTmpSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
