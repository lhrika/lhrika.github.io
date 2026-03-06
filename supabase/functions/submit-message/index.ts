import { corsHeaders } from 'cors' // v2.95.0+
import { createClient } from 'supabase'
import verify from '../_shared/cloudflareTurnstileVerify.ts'
function ips(req: Request) {
	return req.headers.get('x-forwarded-for')?.split(/\s*,\s*/)
}
Deno.serve(async req => {
	// This is needed if you're planning to invoke your function from a browser.
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders })
	}
	const { token, content, name } = await req.json()
	const clientIps = ips(req) || ['']
	const result = await verify(token, clientIps)
	if (result.success) {
		const supabase = createClient(
			Deno.env.get('SUPABASE_URL') ?? '',
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
			{
				auth: {
					persistSession: false,
					autoRefreshToken: false,
					detectSessionInUrl: false,
				},
			},
		)
		const { error } = await supabase.from('messages').insert({
			content: content,
			name: name,
		})
		if (!error) {
			return new Response('Success', { headers: corsHeaders, status: 200 })
		}
	}
	return new Response('Failed', { headers: corsHeaders, status: 400 })
})
