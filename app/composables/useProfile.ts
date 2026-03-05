export const useProfile = (id: string) => {
	return useAsyncData(`profile-${id}`, () =>
		queryCollection('profiles').where('uuid', '=', id).first(),
	)
}
