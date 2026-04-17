// wrapType landing page — hero, live demo, how it works, usage, API
import Demo from "@/components/Demo"
import CopyInstall from "@/components/CopyInstall"
import CodeBlock from "@/components/CodeBlock"
import ToolDirectory from "@/components/ToolDirectory"
import { version } from "../../../package.json"
import { version as siteVersion } from "../../package.json"
import SiteFooter from "../components/SiteFooter"

export default function Home() {
	return (
		<main className="flex flex-col items-center px-6 py-20 gap-24">

			{/* Hero */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<p className="text-xs uppercase tracking-widest opacity-50">wrapType</p>
					<h1 className="text-4xl lg:text-8xl xl:text-9xl" style={{ fontFamily: "var(--font-merriweather), serif", fontWeight: 300, lineHeight: "1.05em" }}>
						Text on a surface,<br />
						<span style={{ opacity: 0.5, fontStyle: "italic" }}>still real DOM.</span>
					</h1>
				</div>
				<div className="flex items-center gap-4">
					<CopyInstall />
					<a
						href="https://github.com/Liiift-Studio/WrapType"
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm opacity-50 hover:opacity-100 transition-opacity"
					>
						GitHub ↗
					</a>
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-50 tracking-wide">
					<span>TypeScript</span><span>·</span>
					<span>Three.js CSS3DRenderer</span><span>·</span>
					<span>React + Vanilla JS</span>
				</div>
				<p className="text-base opacity-60 leading-relaxed max-w-lg">
					CSS transforms can fake 3D. wrapType does it properly — distributing
					real DOM text elements across the surface of a sphere, cylinder, torus,
					or flat plane using Three.js&apos;s CSS3DRenderer. Variable fonts, CSS
					animations, and every other Liiift tool compose naturally because the
					characters are actual HTML, not canvas pixels.
				</p>
			</section>

			{/* Interactive demo */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-4">
				<p className="text-xs uppercase tracking-widest opacity-50">Interactive demo</p>
				<div className="rounded-xl -mx-8 px-8 py-8" style={{ background: "rgba(0,0,0,0.25)", overflow: "hidden" }}>
					<Demo />
				</div>
			</section>

			{/* How it works */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<p className="text-xs uppercase tracking-widest opacity-50">How it works</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-sm leading-relaxed opacity-70">
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Real DOM on every surface</p>
						<p>
							Three.js&apos;s CSS3DRenderer places HTML elements in 3D space using
							CSS <code className="text-xs font-mono">perspective</code> and
							<code className="text-xs font-mono"> matrix3d</code> transforms.
							Each character is its own element, oriented so its face points along
							the surface normal at that point.
						</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Surface geometry, not a canvas</p>
						<p>
							Character positions are computed analytically from the shape
							equations — no UV unwrapping or texture atlases. Spheres use
							latitude-band distribution scaled by circumference; cylinders and
							tori follow arc-length parameterisation.
						</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Four fill modes</p>
						<p>
							<strong>Cover</strong> tiles the entire surface. <strong>Flow</strong>{" "}
							runs a single band around the circumference or equator.{" "}
							<strong>Full-width</strong> fills the widest pass. <strong>Full-height</strong>{" "}
							runs pole-to-pole. Text always repeats to fill the chosen region.
						</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Composes with everything</p>
						<p>
							Because characters are real DOM, <code className="text-xs font-mono">font-variation-settings</code>,
							CSS animations, hover states, and other Liiift tools all work
							without any special integration. The renderer re-mounts the scene
							when props change.
						</p>
					</div>
				</div>
			</section>

			{/* 3D file best practices */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<p className="text-xs uppercase tracking-widest opacity-50">Custom meshes</p>
				<p className="text-sm opacity-60 leading-relaxed max-w-lg">
					Drop any <code className="text-xs font-mono">.glb</code>,{" "}
					<code className="text-xs font-mono">.gltf</code>, or{" "}
					<code className="text-xs font-mono">.obj</code> file onto the demo above.
					wrapType samples the surface with{" "}
					<code className="text-xs font-mono">MeshSurfaceSampler</code>, orients each
					character along the local normal, then auto-scales to fit the scene radius.
				</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm leading-relaxed opacity-70">
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Prefer GLB over OBJ</p>
						<p>
							GLB is a self-contained binary bundle — no separate{" "}
							<code className="text-xs font-mono">.mtl</code> or texture files.
							Normals, materials, and the scene hierarchy are all embedded.
							OBJ works but ships without normals by default; wrapType computes
							them automatically when absent.
						</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">One mesh, merged geometry</p>
						<p>
							wrapType picks the first <code className="text-xs font-mono">Mesh</code> it
							finds in the scene graph. For multi-part models, merge all objects into
							a single mesh before exporting so the full surface is sampled, not
							just one component.
						</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Keep polygon count reasonable</p>
						<p>
							5,000–50,000 triangles is plenty. Higher counts do not improve text
							placement quality — <code className="text-xs font-mono">MeshSurfaceSampler</code>{" "}
							distributes characters area-proportionally regardless. Lighter meshes
							load and parse faster in the browser.
						</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Scale and coordinate system</p>
						<p>
							GLTF and OBJ both use Y-up, right-handed axes. wrapType auto-fits the
							bounding box to its <code className="text-xs font-mono">radius</code> option,
							so absolute model scale does not matter. Recalculate normals in your
							DCC tool after any non-uniform scaling to keep character orientation
							correct.
						</p>
					</div>
				</div>
			</section>

			{/* Usage */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex items-baseline gap-4">
					<p className="text-xs uppercase tracking-widest opacity-50">Usage</p>
					<p className="text-xs opacity-50 tracking-wide">TypeScript + React · Vanilla JS</p>
				</div>
				<div className="flex flex-col gap-8 text-sm">

					<div className="flex flex-col gap-3">
						<p className="opacity-50">React component</p>
						<CodeBlock code={`import { WrapTypeScene } from '@liiift-studio/wraptype'

<WrapTypeScene
  text="Typography is the art and technique of arranging type"
  shape="sphere"
  fill="cover"
  fontSize={13}
  color="rgba(220,210,255,0.85)"
  autoRotate
  style={{ width: '100%', height: '500px' }}
/>`} />
					</div>

					<div className="flex flex-col gap-3">
						<p className="opacity-50">React hook</p>
						<CodeBlock code={`import { useWrapType } from '@liiift-studio/wraptype'

const { ref } = useWrapType({
  text: 'Typography is the art and technique of arranging type',
  shape: 'cylinder',
  fill: 'flow',
})

<div ref={ref} style={{ width: '100%', height: '500px' }} />`} />
					</div>

					<div className="flex flex-col gap-3">
						<p className="opacity-50">Vanilla JS</p>
						<CodeBlock code={`import { getCharPositions, createWrapScene } from '@liiift-studio/wraptype'

const container = document.getElementById('scene')
const positions = getCharPositions({
  text: 'Typography is the art and technique of arranging type',
  shape: 'torus',
  fill: 'cover',
})
const scene = createWrapScene(container, positions, { autoRotate: true })

// Later:
scene.destroy()`} />
					</div>

					<div className="flex flex-col gap-3">
						<p className="opacity-50">Options</p>
						<table className="w-full text-xs">
							<thead>
								<tr className="opacity-50 text-left">
									<th className="pb-2 pr-6 font-normal">Option</th>
									<th className="pb-2 pr-6 font-normal">Default</th>
									<th className="pb-2 font-normal">Description</th>
								</tr>
							</thead>
							<tbody className="opacity-70">
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">text</td><td className="py-2 pr-6">—</td><td className="py-2">The string to distribute across the surface. Repeats to fill.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">shape</td><td className="py-2 pr-6">&apos;sphere&apos;</td><td className="py-2"><code className="font-mono">&apos;sphere&apos;</code> · <code className="font-mono">&apos;cylinder&apos;</code> · <code className="font-mono">&apos;torus&apos;</code> · <code className="font-mono">&apos;plane&apos;</code></td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">fill</td><td className="py-2 pr-6">&apos;cover&apos;</td><td className="py-2"><code className="font-mono">&apos;cover&apos;</code> · <code className="font-mono">&apos;flow&apos;</code> · <code className="font-mono">&apos;full-width&apos;</code> · <code className="font-mono">&apos;full-height&apos;</code></td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">fontSize</td><td className="py-2 pr-6">14</td><td className="py-2">Character font size in px.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">color</td><td className="py-2 pr-6">&apos;#fff&apos;</td><td className="py-2">CSS color applied to every character element.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">radius</td><td className="py-2 pr-6">300</td><td className="py-2">Surface radius in scene units.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">autoRotate</td><td className="py-2 pr-6">false</td><td className="py-2">Continuously rotate the scene.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">autoRotateSpeed</td><td className="py-2 pr-6">1.0</td><td className="py-2">Rotation speed multiplier.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">camera</td><td className="py-2 pr-6">&apos;orbit&apos;</td><td className="py-2"><code className="font-mono">&apos;orbit&apos;</code> (drag to rotate, scroll to zoom) · <code className="font-mono">&apos;fixed&apos;</code></td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">charAdvanceRatio</td><td className="py-2 pr-6">0.62</td><td className="py-2">Fraction of fontSize used as character advance width.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">lineHeightRatio</td><td className="py-2 pr-6">1.4</td><td className="py-2">Line height multiplier relative to fontSize.</td></tr>
							</tbody>
						</table>
					</div>

				</div>
			</section>

			<SiteFooter current="wrapType" npmVersion={version} siteVersion={siteVersion} />

		</main>
	)
}
