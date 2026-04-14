// wrapType/src/core/types.ts — all types, interfaces, and constants

/** Built-in 3D shapes */
export type WrapTypeShape = 'sphere' | 'cylinder' | 'torus' | 'plane' | 'stool' | 'flag'

/** Text placement strategy */
export type WrapTypeMode = 'surface' | 'silhouette'

/**
 * How text fills the surface.
 * cover    — text tiles across the full surface, repeating to fill
 * flow     — text flows in a single band around the widest circumference
 * full-width — single pass scaled to match the widest point, no repeat
 * full-height — text in a vertical column pole-to-pole / top-to-bottom
 * pattern  — text repeats as a tileable pattern with configurable gap
 */
export type WrapTypeFill = 'cover' | 'flow' | 'full-width' | 'full-height' | 'pattern'

/** Camera interaction mode */
export type WrapTypeCamera = 'orbit' | 'fixed'

/** Options accepted by WrapTypeScene, useWrapType, and startWrapType */
export interface WrapTypeOptions {
	/** Text to place on the surface. Repeated to fill in cover/flow/pattern modes. */
	text: string
	/** CSS font-family applied to each character span */
	fontFamily?: string
	/** Font size in CSS pixels (= Three.js world units). Default: 14 */
	fontSize?: number
	/** CSS color of the character spans. Default: 'white' */
	color?: string
	/** Built-in shape to use when no mesh URL is provided. Default: 'sphere' */
	shape?: WrapTypeShape
	/** Surface or silhouette mode. Default: 'surface' */
	mode?: WrapTypeMode
	/** Fill strategy. Default: 'cover' */
	fill?: WrapTypeFill
	/** Camera mode. Default: 'orbit' */
	camera?: WrapTypeCamera
	/** Initial camera position [x, y, z] in world units. Default: [0, 0, 700] */
	cameraPosition?: [number, number, number]
	/** Auto-rotate the scene. Default: false */
	autoRotate?: boolean
	/** Auto-rotate speed multiplier. Default: 1.0 */
	autoRotateSpeed?: number
	/** Sphere/cylinder radius in world units. Default: 300 */
	radius?: number
	/** Cylinder height in world units. Default: radius * 2 */
	height?: number
	/** Estimated character advance width as fraction of fontSize. Default: 0.62 */
	charAdvanceRatio?: number
	/** Line height as fraction of fontSize. Default: 1.4 */
	lineHeightRatio?: number
}

/**
 * Computed position and orientation for a single character on a surface.
 * All vectors are [x, y, z] tuples — plain JS, no Three.js dependency.
 */
export interface CharPosition {
	/** The character to render */
	char: string
	/** World-space position on the surface */
	position: [number, number, number]
	/** Outward surface normal at this position */
	normal: [number, number, number]
	/** Surface tangent pointing in the reading direction (right/eastward) */
	right: [number, number, number]
	/** Surface tangent pointing upward along the surface */
	up: [number, number, number]
}

/** CSS class applied to the scene container */
export const WRAP_TYPE_CLASS = 'wraptype-scene' as const
