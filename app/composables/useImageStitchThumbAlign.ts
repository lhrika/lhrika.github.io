/**
 * Thumbnail-guided layout for a uniform grid of patches.
 *
 * Assumptions:
 *  - All patches have the same dimensions as the thumbnail (patchW = thumbW, patchH = thumbH).
 *  - The patches form a cols × rows grid of the full image.
 *  - Therefore scale = 1 / cols  (= 1 / rows if square grid).
 *
 * For each patch:
 *  1. Downscale it to thumbW/cols × thumbH/rows.
 *  2. Slide it over the thumbnail to find the minimum-SSD position.
 *  3. Map the thumbnail-space position back: origX = tx * cols, origY = ty * rows.
 */

function ssdPatch(
	haystack: Uint8ClampedArray, hw: number,
	needle: Uint8ClampedArray, nw: number, nh: number,
	ox: number, oy: number,
	step: number,
): number {
	let sum = 0; let count = 0
	for (let y = 0; y < nh; y += step) {
		const hRow = (oy + y) * hw; const nRow = y * nw
		for (let x = 0; x < nw; x += step) {
			const hi = (hRow + ox + x) * 4; const ni = (nRow + x) * 4
			const dr = haystack[hi]! - needle[ni]!
			const dg = haystack[hi + 1]! - needle[ni + 1]!
			const db = haystack[hi + 2]! - needle[ni + 2]!
			sum += dr * dr + dg * dg + db * db; count++
		}
	}
	return count > 0 ? sum / count : Infinity
}

function findBestPosition(
	haystack: Uint8ClampedArray, hw: number, hh: number,
	needle: Uint8ClampedArray, nw: number, nh: number,
): { x: number; y: number; score: number } {
	const maxX = hw - nw; const maxY = hh - nh
	if (maxX < 0 || maxY < 0) return { x: 0, y: 0, score: Infinity }

	let bx = 0; let by = 0; let bs = Infinity

	// Pass 1: coarse — step 2 (was 4, finer for better initial estimate)
	for (let y = 0; y <= maxY; y += 2)
		for (let x = 0; x <= maxX; x += 2) {
			const s = ssdPatch(haystack, hw, needle, nw, nh, x, y, 2)
			if (s < bs) { bs = s; bx = x; by = y }
		}
	// Pass 2: fine — ±4, step 1 (exhaustive around best)
	for (let y = Math.max(0, by - 4); y <= Math.min(maxY, by + 4); y++)
		for (let x = Math.max(0, bx - 4); x <= Math.min(maxX, bx + 4); x++) {
			const s = ssdPatch(haystack, hw, needle, nw, nh, x, y, 1)
			if (s < bs) { bs = s; bx = x; by = y }
		}
	return { x: bx, y: by, score: bs }
}


export interface ThumbAlignInput {
	id: string
	src: string
}

export interface ThumbAlignOutput {
	id: string
	x: number
	y: number
	confidence: number
}

export interface ThumbAlignResult {
	placements: ThumbAlignOutput[]
	canvasWidth: number
	canvasHeight: number
	avgConfidence: number
}

export function useImageStitchThumbAlign() {

	/**
	 * @param thumbSrc  blob URL of the thumbnail
	 * @param thumbW    thumbnail pixel width  (= each patch's pixel width)
	 * @param thumbH    thumbnail pixel height (= each patch's pixel height)
	 * @param patches   the image patches to position
	 * @param cols      number of columns in the grid (e.g. 3)
	 * @param rows      number of rows in the grid (e.g. 3)
	 */
	async function alignByThumbnail(
		thumbSrc: string,
		thumbW: number,
		thumbH: number,
		patches: ThumbAlignInput[],
		cols: number,
		rows: number,
	): Promise<ThumbAlignResult> {
		const thumbPixels = await loadPixels(thumbSrc, thumbW, thumbH)

		// Downscaled patch size inside the thumbnail
		const nw = Math.round(thumbW / cols)
		const nh = Math.round(thumbH / rows)

		// Downscale all patches in parallel
		const needles = await Promise.all(patches.map(p => loadPixels(p.src, nw, nh)))

		// Search all patches in parallel (each is independent)
		const placements: ThumbAlignOutput[] = await Promise.all(
			patches.map(async (patch, i) => {
				const { x: tx, y: ty, score } = findBestPosition(thumbPixels, thumbW, thumbH, needles[i]!, nw, nh)
				// Snap to the nearest grid cell to enforce integer grid alignment
				const col = Math.min(Math.round(tx / nw), cols - 1)
				const row = Math.min(Math.round(ty / nh), rows - 1)
				return {
					id: patch.id,
					x: col * thumbW,
					y: row * thumbH,
					confidence: normalizeConfidence(score),
				}
			}),
		)

		return {
			placements,
			canvasWidth: thumbW * cols,
			canvasHeight: thumbH * rows,
			avgConfidence: placements.reduce((s, p) => s + p.confidence, 0) / placements.length,
		}
	}

	return { alignByThumbnail }
}
