export default async (token: string, clientIps: string[]) => {
	const ip = clientIps[0]
	const formData = new FormData()
	formData.append('secret', Deno.env.get('CLOUDFLARE_SECRET_KEY') ?? '')
	formData.append('response', token)
	formData.append('remoteip', ip)
	const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
	const result = await fetch(url, {
		body: formData,
		method: 'POST',
	})
	return await result.json()
}
