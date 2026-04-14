// wrapType/src/react/useWrapType.ts — React hook for mounting a wrapType scene into a ref

'use client'

import { useEffect, useRef } from 'react'
import { getCharPositions } from '../core/geometry'
import { createWrapScene } from '../core/scene'
import type { WrapTypeOptions, CharPosition } from '../core/types'

/** Return value of useWrapType */
export interface WrapTypeHandle {
	/** Attach this ref to the container div */
	ref: React.RefObject<HTMLDivElement | null>
}

/**
 * Low-level hook that mounts a CSS3DRenderer scene into a div ref.
 * Use when you need direct control over the container element.
 *
 * The scene is created on mount, rebuilt when options change, and destroyed on unmount.
 *
 * @example
 * const { ref } = useWrapType({ text: 'Typography', shape: 'sphere', fill: 'cover', autoRotate: true })
 * return <div ref={ref} style={{ width: '100%', height: '500px' }} />
 */
export function useWrapType(opts: WrapTypeOptions): WrapTypeHandle {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = ref.current
		if (!container || typeof window === 'undefined') return

		const positions: CharPosition[] = getCharPositions(opts)
		const handle = createWrapScene(container, positions, opts)

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

	return { ref }
}
