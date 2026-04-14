"use client"

// wrapType demo — live 3D scene with shape and fill controls
import { useState, useDeferredValue } from "react"
import { WrapTypeScene } from "@liiift-studio/wraptype"
import type { WrapTypeShape, WrapTypeFill } from "@liiift-studio/wraptype"

const DEFAULT_TEXT  = "TYPE"
const DEFAULT_SHAPE = "flag"  as WrapTypeShape
const DEFAULT_FILL  = "cover" as WrapTypeFill

const FONT_FAMILY = "Inter, sans-serif"
const FONT_WEIGHT = 900
const FONT_SIZE   = 144

const SHAPES: { value: WrapTypeShape; label: string }[] = [
	{ value: "flag",     label: "Flag"     },
	{ value: "stool",    label: "Stool"    },
	{ value: "sphere",   label: "Sphere"   },
	{ value: "cylinder", label: "Cylinder" },
	{ value: "torus",    label: "Torus"    },
	{ value: "plane",    label: "Plane"    },
]

const FILLS: { value: WrapTypeFill; label: string }[] = [
	{ value: "cover",       label: "Cover"       },
	{ value: "flow",        label: "Flow"        },
	{ value: "full-width",  label: "Full Width"  },
	{ value: "full-height", label: "Full Height" },
]

export default function Demo() {
	const [text,    setText]    = useState(DEFAULT_TEXT)
	const [shape,   setShape]   = useState<WrapTypeShape>(DEFAULT_SHAPE)
	const [fill,    setFill]    = useState<WrapTypeFill>(DEFAULT_FILL)
	const [autoRot, setAutoRot] = useState(true)

	const dText = useDeferredValue(text)

	return (
		<div className="w-full flex flex-col gap-6">

			{/* 3D scene */}
			<div className="rounded-xl overflow-hidden" style={{ height: "500px", background: "rgba(0,0,0,0.4)" }}>
				<WrapTypeScene
					text={dText}
					shape={shape}
					fill={fill}
					fontSize={FONT_SIZE}
					fontFamily={FONT_FAMILY}
					fontWeight={FONT_WEIGHT}
					radius={300}
					color="rgba(220,210,255,0.9)"
					autoRotate={autoRot}
					autoRotateSpeed={0.5}
					style={{ width: "100%", height: "100%" }}
				/>
			</div>

			{/* Controls */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

				{/* Shape */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">Shape</span>
					<div className="flex gap-2 flex-wrap">
						{SHAPES.map(s => (
							<button
								key={s.value}
								onClick={() => setShape(s.value)}
								className={`px-3 py-1.5 rounded-full border transition-colors ${
									shape === s.value
										? "border-white/60 bg-white/10"
										: "border-white/20 hover:border-white/40"
								}`}
							>
								{s.label}
							</button>
						))}
					</div>
				</div>

				{/* Fill */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">Fill</span>
					<div className="flex gap-2 flex-wrap">
						{FILLS.map(f => (
							<button
								key={f.value}
								onClick={() => setFill(f.value)}
								className={`px-3 py-1.5 rounded-full border transition-colors ${
									fill === f.value
										? "border-white/60 bg-white/10"
										: "border-white/20 hover:border-white/40"
								}`}
							>
								{f.label}
							</button>
						))}
					</div>
				</div>

				{/* Auto-rotate */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">Rotation</span>
					<button
						onClick={() => setAutoRot(r => !r)}
						className={`w-fit px-3 py-1.5 rounded-full border transition-colors ${
							autoRot
								? "border-white/60 bg-white/10"
								: "border-white/20 hover:border-white/40"
						}`}
					>
						{autoRot ? "Auto-rotating" : "Paused"}
					</button>
				</div>

				{/* Text */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">Text</span>
					<textarea
						value={text}
						onChange={e => setText(e.target.value)}
						rows={1}
						aria-label="Text to wrap on the surface"
						className="w-full bg-white/5 rounded px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
					/>
				</div>

			</div>

			<p className="text-xs opacity-50 italic" style={{ lineHeight: "1.8" }}>
				Drag to orbit. Scroll to zoom. Characters are measured with canvas
				measureText and justified to fill each row exactly — no fixed tracking.
				The flag animates each frame with no DOM writes.
			</p>
		</div>
	)
}
