export const useAuthenticatedUser = () => {
	return useAsyncData('authenticated-user', async () => {
		const supabase = useSupabaseClient()
		const {
			data: { user },
		} = await supabase.auth.getUser()
		return user
	})
}
