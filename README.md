# wrapType

Real DOM text on any 3D surface — sphere, cylinder, torus, or plane.

wrapType uses Three.js's CSS3DRenderer to distribute HTML text elements across the geometry of a 3D surface. Each character is a real DOM element oriented along the surface normal, which means variable fonts, CSS animations, hover states, and every other Liiift tool compose naturally — no canvas, no textures.

## Install

```bash
npm install @liiift-studio/wraptype three
```

Three.js is a required peer dependency. React and React DOM are optional.

## React

### Component

```tsx
import { WrapTypeScene } from '@liiift-studio/wraptype'

<WrapTypeScene
  text="Typography is the art and technique of arranging type"
  shape="sphere"
  fill="cover"
  fontSize={13}
  color="rgba(220,210,255,0.85)"
  autoRotate
  style={{ width: '100%', height: '500px' }}
/>
```

### Hook

```tsx
import { useWrapType } from '@liiift-studio/wraptype'

const { ref } = useWrapType({
  text: 'Typography is the art and technique of arranging type',
  shape: 'cylinder',
  fill: 'flow',
})

<div ref={ref} style={{ width: '100%', height: '500px' }} />
```

## Vanilla JS

```ts
import { getCharPositions, createWrapScene } from '@liiift-studio/wraptype'

const container = document.getElementById('scene')

const positions = getCharPositions({
  text: 'Typography is the art and technique of arranging type',
  shape: 'torus',
  fill: 'cover',
})

const scene = createWrapScene(container, positions, {
  autoRotate: true,
  autoRotateSpeed: 0.6,
})

// Later, to clean up:
scene.destroy()

// Rebuild after changing options:
const newPositions = getCharPositions({ text: 'New text', shape: 'sphere' })
scene.rebuild(newPositions)
```

## API

### `WrapTypeScene` props / `WrapTypeOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | — | Text to distribute across the surface. Repeats to fill. |
| `shape` | `'sphere' \| 'cylinder' \| 'torus' \| 'plane'` | `'sphere'` | 3D geometry to wrap text onto. |
| `fill` | `'cover' \| 'flow' \| 'full-width' \| 'full-height'` | `'cover'` | How to distribute characters across the surface. |
| `fontSize` | `number` | `14` | Character font size in px. |
| `color` | `string` | `'#fff'` | CSS color applied to every character element. |
| `fontFamily` | `string` | `undefined` | CSS font-family override. |
| `radius` | `number` | `300` | Surface radius in scene units. |
| `height` | `number` | `radius * 2` | Cylinder or plane height in scene units. |
| `autoRotate` | `boolean` | `false` | Continuously rotate the scene. |
| `autoRotateSpeed` | `number` | `1.0` | Rotation speed multiplier. |
| `camera` | `'orbit' \| 'fixed'` | `'orbit'` | `'orbit'` — drag to rotate, scroll to zoom. `'fixed'` — static camera. |
| `cameraPosition` | `[number, number, number]` | `[0, 0, 900]` | Initial camera position in scene units. |
| `charAdvanceRatio` | `number` | `0.62` | Fraction of fontSize used as character advance width. |
| `lineHeightRatio` | `number` | `1.4` | Line height multiplier relative to fontSize. |
| `style` | `CSSProperties` | — | Applied to the container div. (React only) |

### Fill modes

- **`cover`** — tiles the full surface, latitude bands scaled by circumference
- **`flow`** — a single band around the equator / circumference, text repeats
- **`full-width`** — one horizontal pass at the widest point of the shape
- **`full-height`** — one vertical pass from pole to pole

### `SceneHandle`

Returned by `createWrapScene()`:

| Method | Description |
|---|---|
| `destroy()` | Removes the renderer and all event listeners. |
| `rebuild(positions)` | Replaces all character elements without rebuilding the renderer. |

### `getCharPositions(opts)`

Returns `CharPosition[]` — one entry per character instance placed on the surface.

```ts
interface CharPosition {
  char: string
  position: [number, number, number]  // world position
  normal:   [number, number, number]  // outward surface normal
  right:    [number, number, number]  // tangent along text direction
  up:       [number, number, number]  // tangent perpendicular to right
}
```

## How it works

Three.js's CSS3DRenderer maps HTML elements into 3D space using CSS `perspective` and `matrix3d` transforms. wrapType computes character positions analytically from the shape's surface equations — no UV unwrapping or texture atlases.

Each character element is oriented so its visible face points along the outward surface normal using a rotation matrix built from the surface's local right/up/normal frame.

OrbitControls are wired to a transparent overlay `<div>` so that pointer events reach the controls without selecting text.

## Shapes

| Shape | Notes |
|---|---|
| Sphere | Latitude bands from φ = 0.12π to 0.88π. Band character count scales with `sin(φ)`. |
| Cylinder | Characters arc around the circumference, stacked in rows. |
| Torus | Characters follow the outer ring parameterised by major and minor angle. |
| Plane | Grid of characters on a flat surface facing the camera. |

---

Current version: 0.0.11
