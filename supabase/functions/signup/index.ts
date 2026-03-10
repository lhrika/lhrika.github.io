import { corsHeaders } from 'cors' // v2.95.0+
import { createClient } from 'supabase'

Deno.serve(async req => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders })
	}
	const { email, password, inviteCode } = await req.json()

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

	const { data, error } = await supabase
		.from('invite_codes')
		.select('*')
		.eq('code', inviteCode)
		.maybeSingle()

	if (error || !data) {
		return new Response('Invalid invite code', {
			headers: corsHeaders,
			status: 400,
		})
	}

	const now = Date.now()
	const startsAt = data.starts_at ? Date.parse(data.starts_at) : 0
	const expiresAt = data.expiresAt ? Date.parse(data.expires_at) : now + 9999999
	if (now < startsAt || now > expiresAt) {
		return new Response('Invalid invite code', {
			headers: corsHeaders,
			status: 400,
		})
	}

	const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
		email: email,
		password: password,
	})

	if (signUpError) {
		return new Response('Failed to sign up', {
			headers: corsHeaders,
			status: 400,
		})
	}

	return new Response(JSON.stringify(signUpData), {
		headers: { 'Content-Type': 'application/json' },
	})
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/signup' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
