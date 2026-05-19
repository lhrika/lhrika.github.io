/**
 * Automatic alignment of two overlapping image strips.
 *
 * Horizontal mode: images share the same height, overlap on the left/right edges.
 * Vertical mode:   images share the same width,  overlap on the top/bottom edges.
 *
 * We search for the overlap size that minimises the mean Sum of Squared Differences
 * (SSD) between the overlapping regions, using a 3-pass coarse-to-fine scan.
 */

interface AlignResult {
	/** overlap size in pixels that gave the best score */
	overlap: number
	/** normalised confidence 0-1 (higher = better match) */
	confidence: number
}


/**
 * Horizontal SSD: compare right edge of img1 with left edge of img2.
 * Samples a vertical band around the centre.
 */
function ssdH(
	d1: Uint8ClampedArray,
	w1: number,
	h: number,
	d2: Uint8ClampedArray,
	w2: number,
	overlap: number,
	rowStep: number,
	bandFraction: number,
): number {
	const bandH = Math.max(1, Math.round(h * bandFraction))
	const yStart = Math.round((h - bandH) / 2)
	const yEnd = yStart + bandH
	const x1Start = w1 - overlap

	let sum = 0
	let count = 0
	for (let y = yStart; y < yEnd; y += rowStep) {
		const row1 = y * w1
		const row2 = y * w2
		for (let x = 0; x < overlap; x++) {
			const i1 = (row1 + x1Start + x) * 4
			const i2 = (row2 + x) * 4
			const dr = d1[i1]! - d2[i2]!
			const dg = d1[i1 + 1]! - d2[i2 + 1]!
			const db = d1[i1 + 2]! - d2[i2 + 2]!
			sum += dr * dr + dg * dg + db * db
			count++
		}
	}
	return count > 0 ? sum / count : Infinity
}

/**
 * Vertical SSD: compare bottom edge of img1 with top edge of img2.
 * Samples a horizontal band around the centre.
 */
function ssdV(
	d1: Uint8ClampedArray,
	w: number,
	h1: number,
	d2: Uint8ClampedArray,
	_h2: number,
	overlap: number,
	colStep: number,
	bandFraction: number,
): number {
	const bandW = Math.max(1, Math.round(w * bandFraction))
	const xStart = Math.round((w - bandW) / 2)
	const xEnd = xStart + bandW
	const y1Start = h1 - overlap

	let sum = 0
	let count = 0
	for (let y = 0; y < overlap; y++) {
		const row1 = (y1Start + y) * w
		const row2 = y * w
		for (let x = xStart; x < xEnd; x += colStep) {
			const i1 = (row1 + x) * 4
			const i2 = (row2 + x) * 4
			const dr = d1[i1]! - d2[i2]!
			const dg = d1[i1 + 1]! - d2[i2 + 1]!
			const db = d1[i1 + 2]! - d2[i2 + 2]!
			sum += dr * dr + dg * dg + db * db
			count++
		}
	}
	return count > 0 ? sum / count : Infinity
}

/**
 * Coarse-to-fine 3-pass search for the overlap that minimises SSD.
 * The caller provides the SSD function already bound to its pixel data.
 */
function runThreePasses(
	ssd: (ov: number, step: number, band: number) => number,
	minOv: number,
	maxOv: number,
): { overlap: number; score: number } {
	let bestOv = minOv
	let bestScore = Infinity

	// Pass 1: coarse — step 8px, 30% sample band
	for (let ov = minOv; ov <= maxOv; ov += 8) {
		const s = ssd(ov, 4, 0.3)
		if (s < bestScore) {
			bestScore = s
			bestOv = ov
		}
	}
	// Pass 2: fine — ±32px, step 2px, 50% sample band
	for (
		let ov = Math.max(minOv, bestOv - 32);
		ov <= Math.min(maxOv, bestOv + 32);
		ov += 2
	) {
		const s = ssd(ov, 2, 0.5)
		if (s < bestScore) {
			bestScore = s
			bestOv = ov
		}
	}
	// Pass 3: pixel-perfect — ±4px, 70% sample band
	for (
		let ov = Math.max(minOv, bestOv - 4);
		ov <= Math.min(maxOv, bestOv + 4);
		ov++
	) {
		const s = ssd(ov, 1, 0.7)
		if (s < bestScore) {
			bestScore = s
			bestOv = ov
		}
	}

	return { overlap: bestOv, score: bestScore }
}

/**
 * Find best horizontal overlap between img1 (left) and img2 (right).
 */
async function findOverlapH(
	src1: string,
	w1: number,
	h: number,
	src2: string,
	w2: number,
	minOverlapFraction = 0.05,
	maxOverlapFraction = 0.95,
): Promise<{ overlap: number; score: number }> {
	const [d1, d2] = await Promise.all([
		loadPixels(src1, w1, h),
		loadPixels(src2, w2, h),
	])
	const minOv = Math.max(4, Math.round(Math.min(w1, w2) * minOverlapFraction))
	const maxOv = Math.round(Math.min(w1, w2) * maxOverlapFraction)
	return runThreePasses(
		(ov, step, band) => ssdH(d1, w1, h, d2, w2, ov, step, band),
		minOv,
		maxOv,
	)
}

/**
 * Find best vertical overlap between img1 (top) and img2 (bottom).
 */
async function findOverlapV(
	src1: string,
	w: number,
	h1: number,
	src2: string,
	h2: number,
	minOverlapFraction = 0.05,
	maxOverlapFraction = 0.95,
): Promise<{ overlap: number; score: number }> {
	const [d1, d2] = await Promise.all([
		loadPixels(src1, w, h1),
		loadPixels(src2, w, h2),
	])
	const minOv = Math.max(4, Math.round(Math.min(h1, h2) * minOverlapFraction))
	const maxOv = Math.round(Math.min(h1, h2) * maxOverlapFraction)
	return runThreePasses(
		(ov, step, band) => ssdV(d1, w, h1, d2, h2, ov, step, band),
		minOv,
		maxOv,
	)
}

export function useImageStitchAutoAlign() {

	/**
	 * Horizontal alignment: img A and B share the same height, overlap left/right.
	 * hint forces a specific ordering; without it both are tried.
	 */
	async function autoAlignHorizontal(
		srcA: string,
		wA: number,
		srcB: string,
		wB: number,
		height: number,
		hint?: 'a-left' | 'b-left',
	): Promise<(AlignResult & { leftImage: 'a' | 'b' }) | null> {
		if (height <= 0 || wA <= 0 || wB <= 0) return null

		if (hint === 'a-left') {
			const r = await findOverlapH(srcA, wA, height, srcB, wB)
			return {
				overlap: r.overlap,
				confidence: normalizeConfidence(r.score),
				leftImage: 'a',
			}
		}
		if (hint === 'b-left') {
			const r = await findOverlapH(srcB, wB, height, srcA, wA)
			return {
				overlap: r.overlap,
				confidence: normalizeConfidence(r.score),
				leftImage: 'b',
			}
		}

		const [ab, ba] = await Promise.all([
			findOverlapH(srcA, wA, height, srcB, wB),
			findOverlapH(srcB, wB, height, srcA, wA),
		])
		const useAB = ab.score <= ba.score
		const best = useAB ? ab : ba
		return {
			overlap: best.overlap,
			confidence: normalizeConfidence(best.score),
			leftImage: useAB ? 'a' : 'b',
		}
	}

	/**
	 * Vertical alignment: img A and B share the same width, overlap top/bottom.
	 * hint forces a specific ordering; without it both are tried.
	 * Returns the overlap size and which image ended up on top ('a' | 'b').
	 */
	async function autoAlignVertical(
		srcA: string,
		hA: number,
		srcB: string,
		hB: number,
		width: number,
		hint?: 'a-top' | 'b-top',
	): Promise<(AlignResult & { topImage: 'a' | 'b' }) | null> {
		if (width <= 0 || hA <= 0 || hB <= 0) return null

		if (hint === 'a-top') {
			const r = await findOverlapV(srcA, width, hA, srcB, hB)
			return {
				overlap: r.overlap,
				confidence: normalizeConfidence(r.score),
				topImage: 'a',
			}
		}
		if (hint === 'b-top') {
			const r = await findOverlapV(srcB, width, hB, srcA, hA)
			return {
				overlap: r.overlap,
				confidence: normalizeConfidence(r.score),
				topImage: 'b',
			}
		}

		const [ab, ba] = await Promise.all([
			findOverlapV(srcA, width, hA, srcB, hB),
			findOverlapV(srcB, width, hB, srcA, hA),
		])
		const useAB = ab.score <= ba.score
		const best = useAB ? ab : ba
		return {
			overlap: best.overlap,
			confidence: normalizeConfidence(best.score),
			topImage: useAB ? 'a' : 'b',
		}
	}

	return { autoAlignHorizontal, autoAlignVertical }
}
