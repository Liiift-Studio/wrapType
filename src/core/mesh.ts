// wrapType/src/core/mesh.ts — sample CharPositions from an arbitrary Three.js Mesh

import { Vector3 } from 'three'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js'
import type { Mesh } from 'three'
import type { WrapTypeOptions, CharPosition } from './types'

// ─── Tangent frame ────────────────────────────────────────────────────────────

/**
 * Compute a right-handed tangent frame {right, up} for a given outward normal.
 * Uses a reference vector that is never parallel to the normal.
 */
function makeFrame(n: Vector3): {
	right: [number, number, number]
	up:    [number, number, number]
} {
	// Pick a reference vector not collinear with n
	const ref  = Math.abs(n.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0)
	const right = new Vector3().crossVectors(ref, n).normalize()
	// Guard against degenerate cross product (extremely unlikely with the ref switch above)
	if (right.lengthSq() < 1e-6) right.set(1, 0, 0)
	const up = new Vector3().crossVectors(n, right).normalize()
	return {
		right: [right.x, right.y, right.z],
		up:    [up.x,    up.y,    up.z],
	}
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sample `count` character positions uniformly distributed across the surface
 * of an arbitrary Three.js Mesh.
 *
 * The mesh geometry is centred and scaled so its longest bounding-box dimension
 * fits inside a sphere of the given radius. Normals are taken from the mesh's
 * geometry attributes (vertex normals are computed on-demand if absent).
 *
 * @param mesh   A Three.js `Mesh` with a valid `BufferGeometry`
 * @param text   The string to cycle through (repeats to fill `count` slots)
 * @param opts   Optional radius (world units, default 300)
 * @param count  Number of character positions to generate (default 250)
 */
export function getCharPositionsFromMesh(
	mesh:  Mesh,
	text:  string,
	opts?: Pick<WrapTypeOptions, 'radius'>,
	count  = 250,
): CharPosition[] {
	const safeText = text || 'Type'
	const radius   = opts?.radius ?? 300

	const geom = mesh.geometry

	// Ensure vertex normals exist for the sampler to interpolate
	if (!geom.attributes.normal) geom.computeVertexNormals()

	// Compute bounding box in local (geometry) space
	geom.computeBoundingBox()
	const box    = geom.boundingBox!
	const center = new Vector3()
	const size   = new Vector3()
	box.getCenter(center)
	box.getSize(size)
	// Scale so the longest side spans the full diameter (radius × 2)
	const maxDim = Math.max(size.x, size.y, size.z) || 1
	const scale  = (radius * 2) / maxDim

	// Build the surface sampler — samples positions and normals in local space
	const sampler = new MeshSurfaceSampler(mesh).build()
	const pos  = new Vector3()
	const norm = new Vector3()

	const positions: CharPosition[] = []

	for (let i = 0; i < count; i++) {
		sampler.sample(pos, norm)

		// Centre and scale from local geometry space to scene units
		const px = (pos.x - center.x) * scale
		const py = (pos.y - center.y) * scale
		const pz = (pos.z - center.z) * scale

		norm.normalize()
		const { right, up } = makeFrame(norm)

		positions.push({
			char:     safeText[i % safeText.length],
			position: [px, py, pz],
			normal:   [norm.x, norm.y, norm.z],
			right,
			up,
		})
	}

	return positions
}
