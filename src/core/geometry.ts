// wrapType/src/core/geometry.ts — character position computation for each shape and fill mode

import type { WrapTypeOptions, CharPosition } from './types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise a 3-vector */
function norm(v: [number, number, number]): [number, number, number] {
	const len = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
	if (len === 0) return [0, 1, 0]
	return [v[0] / len, v[1] / len, v[2] / len]
}

/** Cross product of two 3-vectors */
function cross(
	a: [number, number, number],
	b: [number, number, number],
): [number, number, number] {
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0],
	]
}

/** Dot product of two 3-vectors */
function dot(a: [number, number, number], b: [number, number, number]): number {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/**
 * Compute right/up orientation vectors for a surface point.
 * right = eastward tangent (reading direction)
 * up    = northward tangent on surface
 * Both are perpendicular to normal.
 */
function surfaceFrame(
	normal: [number, number, number],
): { right: [number, number, number]; up: [number, number, number] } {
	const worldUp: [number, number, number] =
		Math.abs(dot(normal, [0, 1, 0])) > 0.99
			? [0, 0, 1]  // degenerate at poles — use Z as reference
			: [0, 1, 0]
	const right = norm(cross(worldUp, normal))
	const up    = norm(cross(normal, right))
	return { right, up }
}

// ─── Sphere ───────────────────────────────────────────────────────────────────

/**
 * Place characters around the sphere equator (flow mode).
 * Text repeats to fill the full circumference.
 */
function sphereFlow(text: string, opts: WrapTypeOptions): CharPosition[] {
	const r      = opts.radius ?? 300
	const adv    = (opts.fontSize ?? 14) * (opts.charAdvanceRatio ?? 0.62)
	const total  = Math.max(text.length, Math.ceil(2 * Math.PI * r / adv))
	const step   = adv / r  // radians per character

	const positions: CharPosition[] = []
	for (let i = 0; i < total; i++) {
		const theta  = i * step
		const x      = r * Math.cos(theta)
		const z      = r * Math.sin(theta)
		const normal = norm([x, 0, z])
		const right: [number, number, number] = [-Math.sin(theta), 0, Math.cos(theta)]
		const up: [number, number, number]    = [0, 1, 0]
		positions.push({ char: text[i % text.length], position: [x, 0, z], normal, right, up })
	}
	return positions
}

/**
 * Tile characters across the sphere surface in latitude bands (cover mode).
 * Text repeats to fill all bands.
 */
function sphereCover(text: string, opts: WrapTypeOptions): CharPosition[] {
	const r      = opts.radius ?? 300
	const fs     = opts.fontSize ?? 14
	const adv    = fs * (opts.charAdvanceRatio ?? 0.62)
	const lineH  = fs * (opts.lineHeightRatio  ?? 1.4)

	// Avoid poles (top and bottom 12°)
	const phiMin = Math.PI * 0.12
	const phiMax = Math.PI * 0.88
	const bands  = Math.max(1, Math.floor((phiMax - phiMin) * r / lineH))

	const positions: CharPosition[] = []
	let idx = 0

	for (let b = 0; b <= bands; b++) {
		const phi    = phiMin + (b / bands) * (phiMax - phiMin)
		const y      = r * Math.cos(phi)
		const ringR  = r * Math.sin(phi)
		const count  = Math.max(1, Math.ceil(2 * Math.PI * ringR / adv))

		for (let c = 0; c < count; c++) {
			const theta  = (c / count) * 2 * Math.PI
			const x      = ringR * Math.cos(theta)
			const z      = ringR * Math.sin(theta)
			const normal: [number, number, number] = norm([x, y, z])

			// Reading direction: tangent to latitude circle (eastward)
			const right: [number, number, number] = [-Math.sin(theta), 0, Math.cos(theta)]
			// Up on surface: northward meridian direction
			const cosPhi = Math.cos(phi)
			const sinPhi = Math.sin(phi)
			const up: [number, number, number] = [
				-cosPhi * Math.cos(theta),
				sinPhi,
				-cosPhi * Math.sin(theta),
			]

			positions.push({ char: text[idx % text.length], position: [x, y, z], normal, right, up })
			idx++
		}
	}
	return positions
}

/**
 * Scale text to fill exactly the sphere's widest point (equator) in one pass.
 * Characters are placed at equal arc length with fontSize scaled to fit.
 */
function sphereFullWidth(text: string, opts: WrapTypeOptions): CharPosition[] {
	const r          = opts.radius ?? 300
	const circ       = 2 * Math.PI * r
	const scaledAdv  = circ / text.length
	const step       = scaledAdv / r

	return text.split('').map((char, i) => {
		const theta  = i * step
		const x      = r * Math.cos(theta)
		const z      = r * Math.sin(theta)
		const normal = norm([x, 0, z])
		const right: [number, number, number] = [-Math.sin(theta), 0, Math.cos(theta)]
		const up: [number, number, number]    = [0, 1, 0]
		return { char, position: [x, 0, z], normal, right, up }
	})
}

/**
 * Place text in a single vertical strip running pole-to-pole (full-height mode).
 * Characters repeat down the meridian.
 */
function sphereFullHeight(text: string, opts: WrapTypeOptions): CharPosition[] {
	const r      = opts.radius ?? 300
	const fs     = opts.fontSize ?? 14
	const lineH  = fs * (opts.lineHeightRatio ?? 1.4)
	const phiMin = Math.PI * 0.05
	const phiMax = Math.PI * 0.95
	const total  = Math.ceil((phiMax - phiMin) * r / lineH)

	const positions: CharPosition[] = []
	for (let i = 0; i < total; i++) {
		const phi    = phiMin + (i / total) * (phiMax - phiMin)
		const x      = r * Math.sin(phi)
		const y      = r * Math.cos(phi)
		const z      = 0
		const normal = norm([x, y, z])
		const { right, up } = surfaceFrame(normal)
		positions.push({ char: text[i % text.length], position: [x, y, z], normal, right, up })
	}
	return positions
}

// ─── Cylinder ─────────────────────────────────────────────────────────────────

/** Place characters around the cylinder circumference in a single band (flow). */
function cylinderFlow(text: string, opts: WrapTypeOptions): CharPosition[] {
	const r     = opts.radius ?? 300
	const adv   = (opts.fontSize ?? 14) * (opts.charAdvanceRatio ?? 0.62)
	const total = Math.max(text.length, Math.ceil(2 * Math.PI * r / adv))
	const step  = adv / r

	return Array.from({ length: total }, (_, i) => {
		const theta  = i * step
		const x      = r * Math.cos(theta)
		const z      = r * Math.sin(theta)
		const normal: [number, number, number] = [Math.cos(theta), 0, Math.sin(theta)]
		const right: [number, number, number]  = [-Math.sin(theta), 0, Math.cos(theta)]
		const up: [number, number, number]     = [0, 1, 0]
		return { char: text[i % text.length], position: [x, 0, z], normal, right, up }
	})
}

/** Tile characters across the full cylinder surface in rows (cover). */
function cylinderCover(text: string, opts: WrapTypeOptions): CharPosition[] {
	const r      = opts.radius ?? 300
	const h      = opts.height ?? r * 2
	const fs     = opts.fontSize ?? 14
	const adv    = fs * (opts.charAdvanceRatio ?? 0.62)
	const lineH  = fs * (opts.lineHeightRatio  ?? 1.4)
	const rows   = Math.max(1, Math.ceil(h / lineH))
	const cols   = Math.max(1, Math.ceil(2 * Math.PI * r / adv))
	const step   = (2 * Math.PI) / cols

	const positions: CharPosition[] = []
	let idx = 0

	for (let row = 0; row < rows; row++) {
		const y = -h / 2 + (row + 0.5) * lineH
		for (let col = 0; col < cols; col++) {
			const theta  = col * step
			const x      = r * Math.cos(theta)
			const z      = r * Math.sin(theta)
			const normal: [number, number, number] = [Math.cos(theta), 0, Math.sin(theta)]
			const right: [number, number, number]  = [-Math.sin(theta), 0, Math.cos(theta)]
			const up: [number, number, number]     = [0, 1, 0]
			positions.push({ char: text[idx % text.length], position: [x, y, z], normal, right, up })
			idx++
		}
	}
	return positions
}

// ─── Torus ────────────────────────────────────────────────────────────────────

/** Place characters around the outer torus ring (flow). */
function torusFlow(text: string, opts: WrapTypeOptions): CharPosition[] {
	// Major radius R (center of tube to center of torus), minor radius r (tube radius)
	const R    = opts.radius ?? 300
	const r    = Math.round(R * 0.3)  // tube radius = 30% of major radius
	const adv  = (opts.fontSize ?? 14) * (opts.charAdvanceRatio ?? 0.62)
	const circ = 2 * Math.PI * (R + r)  // outer circumference
	const total = Math.max(text.length, Math.ceil(circ / adv))
	const step  = adv / (R + r)

	return Array.from({ length: total }, (_, i) => {
		const phi    = i * step  // angle around the torus ring
		const x      = (R + r) * Math.cos(phi)
		const z      = (R + r) * Math.sin(phi)
		const y      = 0
		const normal = norm([Math.cos(phi), 0, Math.sin(phi)])
		const right: [number, number, number]  = [-Math.sin(phi), 0, Math.cos(phi)]
		const up: [number, number, number]     = [0, 1, 0]
		return { char: text[i % text.length], position: [x, y, z], normal, right, up }
	})
}

/** Tile characters across the full torus surface (cover). */
function torusCover(text: string, opts: WrapTypeOptions): CharPosition[] {
	const R      = opts.radius ?? 300
	const r      = Math.round(R * 0.3)
	const fs     = opts.fontSize ?? 14
	const adv    = fs * (opts.charAdvanceRatio ?? 0.62)
	const lineH  = fs * (opts.lineHeightRatio ?? 1.4)
	const majCols = Math.max(1, Math.ceil(2 * Math.PI * R / adv))
	const minRows = Math.max(1, Math.ceil(2 * Math.PI * r / lineH))
	const majStep = (2 * Math.PI) / majCols
	const minStep = (2 * Math.PI) / minRows

	const positions: CharPosition[] = []
	let idx = 0

	for (let row = 0; row < minRows; row++) {
		const theta = row * minStep  // angle around the tube
		for (let col = 0; col < majCols; col++) {
			const phi  = col * majStep  // angle around the major ring
			const dist = R + r * Math.cos(theta)
			const x    = dist * Math.cos(phi)
			const z    = dist * Math.sin(phi)
			const y    = r * Math.sin(theta)

			// Outward normal (away from the tube center)
			const nx = Math.cos(theta) * Math.cos(phi)
			const ny = Math.sin(theta)
			const nz = Math.cos(theta) * Math.sin(phi)
			const normal: [number, number, number] = [nx, ny, nz]
			const { right, up } = surfaceFrame(normal)

			positions.push({ char: text[idx % text.length], position: [x, y, z], normal, right, up })
			idx++
		}
	}
	return positions
}

// ─── Plane ────────────────────────────────────────────────────────────────────

/** Tile characters across a flat plane facing the camera (cover). */
function planeCover(text: string, opts: WrapTypeOptions): CharPosition[] {
	const size   = (opts.radius ?? 300) * 2
	const fs     = opts.fontSize ?? 14
	const adv    = fs * (opts.charAdvanceRatio ?? 0.62)
	const lineH  = fs * (opts.lineHeightRatio ?? 1.4)
	const cols   = Math.max(1, Math.ceil(size / adv))
	const rows   = Math.max(1, Math.ceil(size / lineH))

	const positions: CharPosition[] = []
	let idx = 0

	for (let row = 0; row < rows; row++) {
		const y = size / 2 - (row + 0.5) * lineH
		for (let col = 0; col < cols; col++) {
			const x = -size / 2 + (col + 0.5) * adv
			const normal: [number, number, number] = [0, 0, 1]
			const right: [number, number, number]  = [1, 0, 0]
			const up: [number, number, number]     = [0, 1, 0]
			positions.push({ char: text[idx % text.length], position: [x, y, 0], normal, right, up })
			idx++
		}
	}
	return positions
}

// ─── Stool ────────────────────────────────────────────────────────────────────

/**
 * Place characters in a single band around the stool's seat rim (flow mode).
 * The seat rim is a cylinder at the top of the stool — gives a clean circular
 * silhouette and is the lowest element count of any stool fill.
 */
function stoolFlow(text: string, opts: WrapTypeOptions): CharPosition[] {
	const r      = opts.radius ?? 200
	const seatY  = r * 0.55            // seat elevation above origin
	const adv    = (opts.fontSize ?? 14) * (opts.charAdvanceRatio ?? 0.62)
	const total  = Math.max(text.length, Math.ceil(2 * Math.PI * r / adv))
	const step   = adv / r

	return Array.from({ length: total }, (_, i) => {
		const theta   = i * step
		const x       = r * Math.cos(theta)
		const z       = r * Math.sin(theta)
		const normal: [number, number, number] = [Math.cos(theta), 0, Math.sin(theta)]
		const right: [number, number, number]  = [-Math.sin(theta), 0, Math.cos(theta)]
		const up: [number, number, number]     = [0, 1, 0]
		return { char: text[i % text.length], position: [x, seatY, z], normal, right, up }
	})
}

/**
 * Cover the stool surface — seat top (flat disk), seat rim (short cylinder),
 * and four legs (thin cylinders at the corners).
 */
function stoolCover(text: string, opts: WrapTypeOptions): CharPosition[] {
	const r         = opts.radius ?? 200
	const seatY     = r * 0.55
	const seatThick = r * 0.08
	const legRadius = Math.max(8, r * 0.07)
	const legOffset = r * 0.58          // XZ distance of each leg from centre
	const legBottom = -r * 1.2
	const legHeight = seatY - legBottom
	const fs        = opts.fontSize ?? 14
	const adv       = fs * (opts.charAdvanceRatio ?? 0.62)
	const lineH     = fs * (opts.lineHeightRatio  ?? 1.4)

	const positions: CharPosition[] = []
	let idx = 0

	// — Seat top (flat disk, normal pointing up) ——————————————————————————
	const gridStep = adv
	const steps    = Math.ceil(r * 2 / gridStep)
	for (let row = 0; row < steps; row++) {
		for (let col = 0; col < steps; col++) {
			const x = -r + (col + 0.5) * gridStep
			const z = -r + (row + 0.5) * gridStep
			if (x * x + z * z > r * r) continue   // skip outside disk
			const normal: [number, number, number] = [0, 1, 0]
			const right: [number, number, number]  = [1, 0, 0]
			const up: [number, number, number]     = [0, 0, -1]
			positions.push({ char: text[idx++ % text.length], position: [x, seatY, z], normal, right, up })
		}
	}

	// — Seat rim (short cylinder) —————————————————————————————————————————
	const rimCols = Math.ceil(2 * Math.PI * r / adv)
	const rimRows = Math.max(1, Math.ceil(seatThick / lineH))
	for (let row = 0; row < rimRows; row++) {
		const y = seatY - seatThick + (row + 0.5) * lineH
		for (let col = 0; col < rimCols; col++) {
			const theta   = (col / rimCols) * 2 * Math.PI
			const x       = r * Math.cos(theta)
			const z       = r * Math.sin(theta)
			const normal: [number, number, number] = [Math.cos(theta), 0, Math.sin(theta)]
			const right: [number, number, number]  = [-Math.sin(theta), 0, Math.cos(theta)]
			const up: [number, number, number]     = [0, 1, 0]
			positions.push({ char: text[idx++ % text.length], position: [x, y, z], normal, right, up })
		}
	}

	// — Four legs (thin cylinders at ±legOffset corners) —————————————————
	const legCorners: [number, number][] = [
		[ legOffset,  legOffset],
		[-legOffset,  legOffset],
		[ legOffset, -legOffset],
		[-legOffset, -legOffset],
	]
	const legRows = Math.ceil(legHeight / lineH)
	const legCols = Math.max(1, Math.ceil(2 * Math.PI * legRadius / adv))

	for (const [lx, lz] of legCorners) {
		for (let row = 0; row < legRows; row++) {
			const y = legBottom + (row + 0.5) * lineH
			for (let col = 0; col < legCols; col++) {
				const theta   = (col / legCols) * 2 * Math.PI
				const nx      = Math.cos(theta)
				const nz      = Math.sin(theta)
				const normal: [number, number, number] = [nx, 0, nz]
				const right: [number, number, number]  = [-Math.sin(theta), 0, Math.cos(theta)]
				const up: [number, number, number]     = [0, 1, 0]
				positions.push({
					char: text[idx++ % text.length],
					position: [lx + legRadius * nx, y, lz + legRadius * nz],
					normal, right, up,
				})
			}
		}
	}

	return positions
}

// ─── Flag ─────────────────────────────────────────────────────────────────────

/**
 * Compute one world-space point on the waving flag surface.
 * u ∈ [0,1]: 0 = mast (fixed), 1 = free edge (max displacement)
 * v ∈ [0,1]: 0 = bottom edge, 1 = top edge
 * Deformation is purely in Z so text reads naturally on the XY face.
 */
function flagPoint(
	u: number, v: number, t: number,
	W: number, H: number, amp: number, omega: number, speed: number,
): [number, number, number] {
	const phase = u * omega * 2 * Math.PI - t * speed
	return [
		(u - 0.5) * W,
		(v - 0.5) * H,
		amp * Math.sin(phase) * u,
	]
}

/**
 * Compute a CharPosition on the flag at grid coordinate (u, v, t).
 * Uses a tiny forward-difference step to derive the tangent and normal analytically.
 */
function flagCharAt(
	char: string,
	u: number, v: number, t: number,
	W: number, H: number, amp: number, omega: number, speed: number,
): CharPosition {
	const EPS = 1e-4
	const p   = flagPoint(u, v, t, W, H, amp, omega, speed)

	// Use forward difference normally; backward at the free edge (u = 1)
	// to avoid clamping that would collapse the tangent to zero.
	let rawTangent: [number, number, number]
	if (u <= 1 - EPS) {
		const pDu = flagPoint(u + EPS, v, t, W, H, amp, omega, speed)
		rawTangent = [pDu[0] - p[0], pDu[1] - p[1], pDu[2] - p[2]]
	} else {
		const pDu = flagPoint(u - EPS, v, t, W, H, amp, omega, speed)
		rawTangent = [p[0] - pDu[0], p[1] - pDu[1], p[2] - pDu[2]]
	}

	// Tangent along reading direction (width-wise, +X on flag face)
	const right = norm(rawTangent)

	// Up is always world +Y — no vertical deformation in this wave model
	const up: [number, number, number] = [0, 1, 0]

	// Normal = right × up. Points toward viewer (+Z) when flag is flat.
	let normal = norm(cross(right, up))

	// Guarantee outward facing (toward the +Z camera)
	if (normal[2] < 0) normal = [-normal[0], -normal[1], -normal[2]]

	return { char, position: p, normal, right, up }
}

/** Fill the entire flag surface with text (cover mode). */
function flagCover(text: string, opts: WrapTypeOptions, t: number): CharPosition[] {
	const W     = (opts.radius ?? 300) * 1.5
	const H     = opts.radius ?? 300
	const amp   = H * 0.12
	const omega = 1.5
	const speed = 2.5
	const fs    = opts.fontSize ?? 14
	const adv   = fs * (opts.charAdvanceRatio ?? 0.62)
	const lineH = fs * (opts.lineHeightRatio  ?? 1.4)
	const cols  = Math.max(1, Math.ceil(W / adv))
	const rows  = Math.max(1, Math.ceil(H / lineH))

	const positions: CharPosition[] = []
	let idx = 0

	for (let row = 0; row < rows; row++) {
		const v = rows > 1 ? row / (rows - 1) : 0.5
		for (let col = 0; col < cols; col++) {
			const u = cols > 1 ? col / (cols - 1) : 0.5
			positions.push(flagCharAt(text[idx++ % text.length], u, v, t, W, H, amp, omega, speed))
		}
	}
	return positions
}

/** Place a single row of text along the centre of the flag (flow mode). */
function flagFlow(text: string, opts: WrapTypeOptions, t: number): CharPosition[] {
	const W     = (opts.radius ?? 300) * 1.5
	const H     = opts.radius ?? 300
	const amp   = H * 0.12
	const omega = 1.5
	const speed = 2.5
	const fs    = opts.fontSize ?? 14
	const adv   = fs * (opts.charAdvanceRatio ?? 0.62)
	const cols  = Math.max(1, Math.ceil(W / adv))

	return Array.from({ length: cols }, (_, col) => {
		const u = cols > 1 ? col / (cols - 1) : 0.5
		return flagCharAt(text[col % text.length], u, 0.5, t, W, H, amp, omega, speed)
	})
}

// ─── Animation helpers ────────────────────────────────────────────────────────

/** Returns true for shapes whose character positions change over time. */
export function isAnimatedShape(shape: string | undefined): boolean {
	return shape === 'flag'
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

/**
 * Compute the full list of character positions and orientations for the given
 * shape + fill combination at an optional animation time `t` (seconds).
 */
export function getCharPositionsAt(opts: WrapTypeOptions, t: number): CharPosition[] {
	const shape = opts.shape ?? 'sphere'
	const fill  = opts.fill  ?? 'cover'
	const text  = opts.text  || 'Type'

	if (shape === 'sphere') {
		if (fill === 'flow')        return sphereFlow(text, opts)
		if (fill === 'full-width')  return sphereFullWidth(text, opts)
		if (fill === 'full-height') return sphereFullHeight(text, opts)
		return sphereCover(text, opts)
	}
	if (shape === 'cylinder') {
		if (fill === 'flow') return cylinderFlow(text, opts)
		return cylinderCover(text, opts)
	}
	if (shape === 'torus') {
		if (fill === 'flow') return torusFlow(text, opts)
		return torusCover(text, opts)
	}
	if (shape === 'plane') {
		return planeCover(text, opts)
	}
	if (shape === 'stool') {
		if (fill === 'flow') return stoolFlow(text, opts)
		return stoolCover(text, opts)
	}
	if (shape === 'flag') {
		if (fill === 'flow') return flagFlow(text, opts, t)
		return flagCover(text, opts, t)
	}
	return sphereCover(text, opts)
}

/** Static alias — equivalent to getCharPositionsAt(opts, 0). */
export function getCharPositions(opts: WrapTypeOptions): CharPosition[] {
	return getCharPositionsAt(opts, 0)
}
