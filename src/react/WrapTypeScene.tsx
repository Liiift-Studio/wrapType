// wrapType/src/react/WrapTypeScene.tsx — React component wrapping the CSS3DRenderer scene

'use client'

import { useEffect, useRef } from 'react'
import { getCharPositions } from '../core/geometry'
import { createWrapScene } from '../core/scene'
import type { WrapTypeOptions } from '../core/types'

/** Props for WrapTypeScene — all WrapTypeOptions plus optional className / style */
export interface WrapTypeSceneProps extends WrapTypeOptions {
	className?: string
	style?: React.CSSProperties
}

/**
 * Renders text wrapping a 3D surface inside a positioned container div.
 * The container fills its parent — give it explicit width and height.
 *
 * The Three.js CSS3DRenderer is initialised on mount and torn down on unmount.
 * The scene rebuilds whenever text, shape, fill, mode, fontSize, fontFamily,
 * color, or radius changes.
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
	...opts
}: WrapTypeSceneProps) {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		if (!container || typeof window === 'undefined') return

		const positions = getCharPositions(opts)
		const handle    = createWrapScene(container, positions, opts)

		return () => handle.destroy()
	}, [
		opts.text,
		opts.shape,
		opts.fill,
		opts.mode,
		opts.fontSize,
		opts.fontFamily,
		opts.color,
		opts.radius,
		opts.height,
		opts.autoRotate,
		opts.autoRotateSpeed,
		opts.camera,
	])

	return (
		<div
			ref={containerRef}
			className={className}
			style={{ width: '100%', height: '100%', ...style }}
		/>
	)
}
