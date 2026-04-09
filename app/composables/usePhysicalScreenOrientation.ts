import { useDeviceOrientation } from '@vueuse/core'

export const usePhysicalScreenOrientation = () => {
	const deviceOrientation = useDeviceOrientation()
	const isLandscape = computed(
		() => Math.abs(deviceOrientation.gamma.value ?? 0) > 45,
	)
	const isPortrait = computed(
		() => Math.abs(deviceOrientation.beta.value ?? 0) > 45,
	)

	return {
		isSupported: deviceOrientation.isSupported,
		isLandscape,
		isPortrait,
	}
}
