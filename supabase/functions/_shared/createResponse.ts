import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

export default (
	body: BodyInit,
	status: number = 200,
	headers?: HeadersInit,
) => {
	return new Response(body, {
		headers: {
			...corsHeaders,
			...headers,
		},
		status: status,
	})
}
