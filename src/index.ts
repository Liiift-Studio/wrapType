// wrapType/src/index.ts — public API exports

// Core types
export type {
	WrapTypeShape,
	WrapTypeMode,
	WrapTypeFill,
	WrapTypeCamera,
	WrapTypeOptions,
	CharPosition,
} from './core/types'

export { WRAP_TYPE_CLASS } from './core/types'

// Core functions
export { getCharPositions } from './core/geometry'
export { createWrapScene }  from './core/scene'
export type { SceneHandle } from './core/scene'

// React
export { WrapTypeScene }    from './react/WrapTypeScene'
export { useWrapType }      from './react/useWrapType'
export type { WrapTypeSceneProps } from './react/WrapTypeScene'
export type { WrapTypeHandle }     from './react/useWrapType'
