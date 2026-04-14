// wrapType/src/react/WrapTypeScene.tsx — React component wrapping the CSS3DRenderer scene

'use client'

import { useEffect, useRef } from 'react'
import { getCharPositions } from '../core/geometry'
import { createWrapScene } from '../core/scene'
import type { WrapTypeOptions, CharPosition } from '../core/types'

/** Props for WrapTypeScene — all WrapTypeOptions plus optional className / style */
export interface WrapTypeSceneProps extends WrapTypeOptions {
	className?: string
	style?: React.CSSProperties
	/**
	 * Pre-computed character positions, e.g. from `getCharPositionsFromMesh`.
	 * When provided, bypasses the built-in geometry computation entirely so
	 * custom mesh surfaces can be used. The scene still respects `autoRotate`,
	 * `color`, `fontSize`, `fontFamily`, and `fontWeight` from the other props.
	 */
	positions?: CharPosition[]
}

/**
 * Renders text wrapping a 3D surface inside a positioned container div.
 * The container fills its parent — give it explicit width and height.
 *
 * The Three.js CSS3DRenderer is initialised on mount and torn down on unmount.
 * The scene rebuilds whenever text, shape, fill, mode, fontSize, fontFamily,
 * color, or radius changes — or when the `positions` prop reference changes.
 *
 * @example
 * <WrapTypeScene
 *   text="Typography"
 *   shape="sphere"
 *   fill="cover"
 *   autoRotate
 *   style={{ width: '100%', height: '500px' }}
 * />
 */
export function WrapTypeScene({
	className,
	style,
	positions: customPositions,
	...opts
}: WrapTypeSceneProps) {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		if (!container || typeof window === 'undefined') return

		const pos    = customPositions ?? getCharPositions(opts)
		const handle = createWrapScene(container, pos, opts)

		return () => handle.destroy()
	}, [
		opts.text,
		opts.shape,
		opts.fill,
		opts.mode,
		opts.fontSize,
		opts.fontFamily,
		opts.fontWeight,
		opts.color,
		opts.radius,
		opts.height,
		opts.autoRotate,
		opts.autoRotateSpeed,
		opts.camera,
		opts.repeat,
		opts.characterCurve,
		customPositions,
	])

	return (
		<div
			ref={containerRef}
			className={className}
			style={{ width: '100%', height: '100%', ...style }}
		/>
	)
}
