// wrapType/src/__tests__/geometry.test.ts — unit tests for geometry computation

import { describe, it, expect } from 'vitest'
import { getCharPositions } from '../core/geometry'
import type { WrapTypeOptions } from '../core/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE: WrapTypeOptions = { text: 'Typography', radius: 300, fontSize: 14 }

/** Euclidean distance from a 3-vector to the origin */
function len(v: [number, number, number]): number {
	return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
}

/** Dot product of two 3-vectors */
function dot(a: [number, number, number], b: [number, number, number]): number {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

// ─── Sphere — flow ────────────────────────────────────────────────────────────

describe('sphere flow', () => {
	const positions = getCharPositions({ ...BASE, shape: 'sphere', fill: 'flow' })

	it('returns at least as many chars as the text length', () => {
		expect(positions.length).toBeGreaterThanOrEqual(BASE.text.length)
	})

	it('all positions lie on the sphere surface', () => {
		for (const cp of positions) {
			expect(len(cp.position)).toBeCloseTo(BASE.radius!, 0)
		}
	})

	it('all positions are on the equator (y ≈ 0)', () => {
		for (const cp of positions) {
			expect(cp.position[1]).toBeCloseTo(0, 5)
		}
	})

	it('all normals are unit vectors', () => {
		for (const cp of positions) {
			expect(len(cp.normal)).toBeCloseTo(1, 5)
		}
	})

	it('normal is perpendicular to right', () => {
		for (const cp of positions) {
			expect(dot(cp.normal, cp.right)).toBeCloseTo(0, 5)
		}
	})

	it('normal is perpendicular to up', () => {
		for (const cp of positions) {
			expect(dot(cp.normal, cp.up)).toBeCloseTo(0, 5)
		}
	})

	it('text characters repeat cyclically', () => {
		for (let i = 0; i < positions.length; i++) {
			expect(positions[i].char).toBe(BASE.text[i % BASE.text.length])
		}
	})
})

// ─── Sphere — cover ───────────────────────────────────────────────────────────

describe('sphere cover', () => {
	const positions = getCharPositions({ ...BASE, shape: 'sphere', fill: 'cover' })

	it('returns many more positions than text length (fills surface)', () => {
		expect(positions.length).toBeGreaterThan(BASE.text.length * 5)
	})

	it('all positions lie on (or very near) the sphere surface', () => {
		for (const cp of positions) {
			const r = len(cp.position)
			// Allow slight deviation from perfect sphere due to trig
			expect(r).toBeGreaterThan((BASE.radius! as number) * 0.99)
			expect(r).toBeLessThan((BASE.radius! as number) * 1.01)
		}
	})

	it('normals are unit vectors', () => {
		for (const cp of positions) {
			expect(len(cp.normal)).toBeCloseTo(1, 4)
		}
	})

	it('positions span multiple y values (multiple latitude bands)', () => {
		const ys = new Set(positions.map(p => Math.round(p.position[1] / 10) * 10))
		expect(ys.size).toBeGreaterThan(3)
	})
})

// ─── Sphere — full-width ──────────────────────────────────────────────────────

describe('sphere full-width', () => {
	const positions = getCharPositions({ ...BASE, shape: 'sphere', fill: 'full-width' })

	it('returns exactly text.length positions', () => {
		expect(positions.length).toBe(BASE.text.length)
	})

	it('all positions at equator', () => {
		for (const cp of positions) {
			expect(cp.position[1]).toBeCloseTo(0, 5)
		}
	})

	it('all positions on sphere surface', () => {
		for (const cp of positions) {
			expect(len(cp.position)).toBeCloseTo(BASE.radius!, 0)
		}
	})
})

// ─── Sphere — full-height ─────────────────────────────────────────────────────

describe('sphere full-height', () => {
	const positions = getCharPositions({ ...BASE, shape: 'sphere', fill: 'full-height' })

	it('returns at least one position', () => {
		expect(positions.length).toBeGreaterThan(0)
	})

	it('positions span a range of y values', () => {
		const ys = positions.map(p => p.position[1])
		const range = Math.max(...ys) - Math.min(...ys)
		// Should span from near +r to near -r
		expect(range).toBeGreaterThan(BASE.radius! as number)
	})
})

// ─── Cylinder — cover ─────────────────────────────────────────────────────────

describe('cylinder cover', () => {
	const positions = getCharPositions({ ...BASE, shape: 'cylinder', fill: 'cover' })

	it('returns more positions than text length', () => {
		expect(positions.length).toBeGreaterThan(BASE.text.length)
	})

	it('all positions at the correct radius from y-axis', () => {
		for (const cp of positions) {
			const r = Math.sqrt(cp.position[0] ** 2 + cp.position[2] ** 2)
			expect(r).toBeCloseTo(BASE.radius!, 0)
		}
	})

	it('all y-normals are zero (cylinder normals are radial)', () => {
		for (const cp of positions) {
			expect(cp.normal[1]).toBeCloseTo(0, 5)
		}
	})
})

// ─── Torus — flow ─────────────────────────────────────────────────────────────

describe('torus flow', () => {
	const positions = getCharPositions({ ...BASE, shape: 'torus', fill: 'flow' })

	it('returns at least text.length positions', () => {
		expect(positions.length).toBeGreaterThanOrEqual(BASE.text.length)
	})

	it('all positions are at y = 0 (outer ring)', () => {
		for (const cp of positions) {
			expect(cp.position[1]).toBeCloseTo(0, 5)
		}
	})
})

// ─── Plane — cover ────────────────────────────────────────────────────────────

describe('plane cover', () => {
	const positions = getCharPositions({ ...BASE, shape: 'plane', fill: 'cover' })

	it('returns more positions than text length', () => {
		expect(positions.length).toBeGreaterThan(BASE.text.length)
	})

	it('all positions at z = 0', () => {
		for (const cp of positions) {
			expect(cp.position[2]).toBe(0)
		}
	})

	it('all normals point in +Z direction', () => {
		for (const cp of positions) {
			expect(cp.normal).toEqual([0, 0, 1])
		}
	})
})

// ─── Dispatcher ───────────────────────────────────────────────────────────────

describe('getCharPositions dispatcher', () => {
	it('defaults to sphere cover when no shape/fill provided', () => {
		const a = getCharPositions({ text: 'Hi' })
		const b = getCharPositions({ text: 'Hi', shape: 'sphere', fill: 'cover' })
		expect(a.length).toBe(b.length)
	})

	it('handles empty-ish text by falling back to "Type"', () => {
		const positions = getCharPositions({ text: '' })
		expect(positions.length).toBeGreaterThan(0)
	})
})
