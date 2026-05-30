// wrapType/src/react/useWrapType.ts — React hook for mounting a wrapType scene into a ref

'use client'

import { useEffect, useRef } from 'react'
import { getCharPositions } from '../core/geometry'
import { createWrapScene } from '../core/scene'
import type { SceneHandle } from '../core/scene'
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
	const ref       = useRef<HTMLDivElement>(null)
	const handleRef = useRef<SceneHandle | null>(null)
	const optsRef   = useRef(opts)
	optsRef.current = opts

	function mount() {
		const container = ref.current
		if (!container || typeof window === 'undefined') return
		handleRef.current?.destroy()
		const positions: CharPosition[] = getCharPositions(optsRef.current)
		handleRef.current = createWrapScene(container, positions, optsRef.current)
	}

	useEffect(() => {
		mount()
		return () => {
			handleRef.current?.destroy()
			handleRef.current = null
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
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
	])

	// Re-mount after fonts load — measureCharWidths uses Canvas API which reads
	// fallback font metrics if called before the variable font finishes loading.
	// Guard with a cancelled flag so mount() is not called after unmount.
	useEffect(() => {
		let cancelled = false
		document.fonts?.ready?.then(() => { if (!cancelled) mount() })
		return () => { cancelled = true }
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return { ref }
}
