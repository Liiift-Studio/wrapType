// wrapType/src/core/scene.ts — CSS3DRenderer scene lifecycle: create, resize, destroy

import {
	Scene,
	PerspectiveCamera,
	Matrix4,
} from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { WrapTypeOptions, CharPosition } from './types'
import { isAnimatedShape, getCharPositionsAt } from './geometry'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Handle returned by createWrapScene — use to resize or destroy the scene */
export interface SceneHandle {
	/** Tear down the scene, cancel the rAF loop, and remove DOM elements */
	destroy: () => void
	/** Rebuild character objects with new positions (call after options change) */
	rebuild: (positions: CharPosition[]) => void
}

// ─── Orientation ──────────────────────────────────────────────────────────────

/**
 * Build a rotation matrix that orients a CSS3DObject so its visible face
 * points along `normal` (outward), with `right` as the reading direction and
 * `up` as the ascender direction.
 *
 * In CSS3DRenderer, an element's visible front face is its local -Z axis.
 * We therefore map:
 *   local +X = right  (reading direction)
 *   local +Y = up     (ascender direction)
 *   local +Z = -normal (so that local -Z = normal = outward face)
 *
 * Matrix4.set() takes row-major arguments: (n11, n12, ...) fills the matrix
 * | n11 n12 n13 n14 |
 * | n21 n22 n23 n24 |   where columns 0-2 are the local X, Y, Z axes.
 * | n31 n32 n33 n34 |
 */
function orientationMatrix(
	right:  [number, number, number],
	up:     [number, number, number],
	normal: [number, number, number],
): Matrix4 {
	const [rx, ry, rz] = right
	const [ux, uy, uz] = up
	const [nx, ny, nz] = normal
	const mat = new Matrix4()
	mat.set(
		rx,  ux,  -nx,  0,
		ry,  uy,  -ny,  0,
		rz,  uz,  -nz,  0,
		0,   0,    0,   1,
	)
	return mat
}

// ─── Scene creation ───────────────────────────────────────────────────────────

/**
 * Initialise a CSS3DRenderer scene inside `container`, place character objects
 * at the computed positions, and start the rAF render loop.
 * Returns a handle to destroy or rebuild the scene.
 */
export function createWrapScene(
	container: HTMLElement,
	charPositions: CharPosition[],
	opts: WrapTypeOptions,
): SceneHandle {
	// ── Scene + camera ─────────────────────────────────────────────────────────
	const scene  = new Scene()
	const width  = container.clientWidth  || 600
	const height = container.clientHeight || 400

	const camera = new PerspectiveCamera(75, width / height, 1, 10000)
	const [cx, cy, cz] = opts.cameraPosition ?? [0, 0, 700]
	camera.position.set(cx, cy, cz)
	camera.lookAt(0, 0, 0)

	// ── CSS3D renderer ─────────────────────────────────────────────────────────
	const renderer = new CSS3DRenderer()
	renderer.setSize(width, height)
	renderer.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;'

	// The container needs position:relative so the absolute renderer overlays correctly
	const prevPos = container.style.position
	if (!prevPos || prevPos === 'static') container.style.position = 'relative'
	container.style.overflow = 'hidden'
	container.appendChild(renderer.domElement)

	// ── Character objects ──────────────────────────────────────────────────────
	const objects: CSS3DObject[] = []

	function buildObjects(positions: CharPosition[]) {
		// Remove existing objects
		for (const o of objects) scene.remove(o)
		objects.length = 0

		for (const cp of positions) {
			const el = document.createElement('span')
			el.textContent = cp.char === ' ' ? '\u00a0' : cp.char  // non-breaking space
			el.style.cssText = [
				`font-family:${opts.fontFamily ?? 'inherit'}`,
				`font-size:${opts.fontSize ?? 14}px`,
				`color:${opts.color ?? 'white'}`,
				'pointer-events:none',
				'user-select:none',
				'white-space:nowrap',
				'display:block',
				'line-height:1',
				'will-change:transform',   // promote each char to its own GPU layer
			].join(';')

			const obj = new CSS3DObject(el)
			const [px, py, pz] = cp.position
			obj.position.set(px, py, pz)
			obj.quaternion.setFromRotationMatrix(
				orientationMatrix(cp.right, cp.up, cp.normal),
			)

			scene.add(obj)
			objects.push(obj)
		}
	}

	buildObjects(charPositions)

	/**
	 * Update existing CSS3DObject positions and rotations in place — no DOM writes.
	 * Falls back to a full rebuild only if the character count changes.
	 */
	function updateObjects(positions: CharPosition[]) {
		if (positions.length !== objects.length) {
			buildObjects(positions)
			return
		}
		for (let i = 0; i < positions.length; i++) {
			const cp  = positions[i]
			const obj = objects[i]
			const [px, py, pz] = cp.position
			obj.position.set(px, py, pz)
			obj.quaternion.setFromRotationMatrix(
				orientationMatrix(cp.right, cp.up, cp.normal),
			)
		}
	}

	// ── Orbit controls ─────────────────────────────────────────────────────────
	// OrbitControls need a DOM element for pointer events — use a transparent
	// overlay so the renderer's domElement can keep pointer-events:none (text).
	let controls: OrbitControls | null = null
	let overlay: HTMLDivElement | null = null

	if (opts.camera !== 'fixed') {
		overlay = document.createElement('div')
		overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;'
		container.appendChild(overlay)

		controls = new OrbitControls(camera, overlay)
		controls.enableDamping    = true
		controls.dampingFactor    = 0.05
		controls.autoRotate       = opts.autoRotate ?? false
		controls.autoRotateSpeed  = opts.autoRotateSpeed ?? 1.0
		controls.enableZoom       = true
		controls.enablePan        = false
	}

	// ── Render loop — dirty flag + pause when off-screen ──────────────────────
	const animated  = isAnimatedShape(opts.shape)
	const startTime = performance.now()
	let rafId       = 0
	let visible     = true
	let needRender  = true   // render at least one frame on mount

	// Mark dirty whenever the camera moves (damping, drag, autoRotate, etc.)
	controls?.addEventListener('change', () => { needRender = true })

	function animate() {
		rafId = requestAnimationFrame(animate)
		if (!visible) return

		// For animated shapes, recompute positions each frame (no DOM writes)
		if (animated) {
			const t = (performance.now() - startTime) / 1000
			updateObjects(getCharPositionsAt(opts, t))
			needRender = true
		}

		// controls.update() returns true when the camera changed (damping / autoRotate)
		const moved = controls?.update() ?? false
		if (moved || needRender) {
			renderer.render(scene, camera)
			needRender = false
		}
	}
	animate()

	// ── Intersection observer — pause rAF while scene is off-screen ────────────
	const io = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting
		if (visible) needRender = true   // force one render on re-entry
	})
	io.observe(container)

	// ── Resize observer ────────────────────────────────────────────────────────
	const ro = new ResizeObserver(() => {
		const w = container.clientWidth
		const h = container.clientHeight
		if (w === 0 || h === 0) return
		camera.aspect = w / h
		camera.updateProjectionMatrix()
		renderer.setSize(w, h)
		if (overlay) { overlay.style.width = `${w}px`; overlay.style.height = `${h}px` }
		needRender = true
	})
	ro.observe(container)

	// ── Handle ─────────────────────────────────────────────────────────────────
	return {
		destroy() {
			cancelAnimationFrame(rafId)
			io.disconnect()
			ro.disconnect()
			controls?.dispose()
			renderer.domElement.remove()
			overlay?.remove()
			scene.clear()
			container.style.position = prevPos
		},
		rebuild(positions: CharPosition[]) {
			buildObjects(positions)
		},
	}
}
