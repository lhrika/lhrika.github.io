const user = useSupabaseUser()

export default defineNuxtRouteMiddleware(async (to, from) => {
	// If the user is not logged in, redirect to the login page
	if (from.path.startsWith('/login')) {
		return
	}
	if (!user.value) {
		return navigateTo(encodeURIComponent('/login?redirect=' + to.fullPath))
	}
})
