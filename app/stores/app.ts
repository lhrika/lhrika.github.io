import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
	const showHeader = ref(true)
	return { showHeader }
})
