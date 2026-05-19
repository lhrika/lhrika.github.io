/**
 * Shared aspect-ratio lock logic for paired width/height inputs.
 *
 * @param getWidth  reactive getter for current width
 * @param getHeight reactive getter for current height
 * @param min       minimum clamped value (default 1)
 */
export function useAspectRatioLock(
	getWidth: () => number,
	getHeight: () => number,
	min = 1,
) {
	const locked = ref(false)

	function onWidth(v: number): { width: number; height: number } {
		const height =
			locked.value && getWidth() > 0
				? Math.max(min, Math.round((v * getHeight()) / getWidth()))
				: getHeight()
		return { width: v, height }
	}

	function onHeight(v: number): { width: number; height: number } {
		const width =
			locked.value && getHeight() > 0
				? Math.max(min, Math.round((v * getWidth()) / getHeight()))
				: getWidth()
		return { width, height: v }
	}

	return { locked, onWidth, onHeight }
}
