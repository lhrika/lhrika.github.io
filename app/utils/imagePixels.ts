/**
 * Shared pixel-level utilities for SSD-based image alignment.
 */

/**
 * Render `src` at the given dimensions into an offscreen canvas and return
 * the raw RGBA pixel data.
 */
export async function loadPixels(
	src: string,
	width: number,
	height: number,
): Promise<Uint8ClampedArray> {
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('Canvas 2D not available')
	ctx.drawImage(await loadImage(src), 0, 0, width, height)
	return ctx.getImageData(0, 0, width, height).data
}

/**
 * Convert a raw SSD score to a 0–1 confidence value.
 * 255² × 3 channels = 195075 is the worst-possible SSD per pixel.
 */
export function normalizeConfidence(score: number): number {
	return Math.max(0, 1 - score / 195075)
}
