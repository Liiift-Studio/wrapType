// Minimal type shim for troika-three-text (package ships no .d.ts)
declare module 'troika-three-text' {
	import * as THREE from 'three'

	/** troika SDF text mesh — a Three.js Object3D with text-specific properties */
	export class Text extends THREE.Object3D {
		text: string
		font: string
		fontSize: number
		letterSpacing: number
		maxWidth: number
		textAlign: 'left' | 'center' | 'right'
		color: string | number
		anchorX: string | number
		anchorY: string | number
		/** Bends the text geometry to follow a circle of the given radius */
		curveRadius: number
		/** Sync geometry after changing properties */
		sync(callback?: () => void): void
		/** Free GPU resources */
		dispose(): void
	}
}
