"use client"

// wrapType demo — live 3D scene with shape, fill, curve, repeat, unit-aware size, and 3D file-drop
import { useState, useDeferredValue, useCallback, useRef } from "react"
import { WrapTypeScene, getCharPositionsFromMesh } from "@liiift-studio/wraptype"
import type { WrapTypeShape, WrapTypeFill, CharPosition } from "@liiift-studio/wraptype"
import { Mesh } from "three"

// ─── Types ────────────────────────────────────────────────────────────────────

type SizeUnit = "px" | "pt" | "em" | "rem" | "vw" | "vh"

interface UnitConfig {
	min: number
	max: number
	step: number
	decimals: number
}

const UNIT_CFG: Record<SizeUnit, UnitConfig> = {
	px:  { min: 12,  max: 400, step: 2,   decimals: 0 },
	pt:  { min: 8,   max: 300, step: 1,   decimals: 0 },
	em:  { min: 0.5, max: 25,  step: 0.1, decimals: 1 },
	rem: { min: 0.5, max: 25,  step: 0.1, decimals: 1 },
	vw:  { min: 1,   max: 35,  step: 0.5, decimals: 1 },
	vh:  { min: 1,   max: 50,  step: 0.5, decimals: 1 },
}

const SIZE_UNITS: SizeUnit[] = ["px", "pt", "em", "rem", "vw", "vh"]

/** Convert a value in any supported unit to CSS pixels. Safe to call server-side. */
function toPx(value: number, unit: SizeUnit): number {
	if (unit === "px")  return value
	if (unit === "pt")  return value * (96 / 72)
	if (unit === "em" || unit === "rem") {
		const rootPx = typeof document !== "undefined"
			? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
			: 16
		return value * rootPx
	}
	if (unit === "vw") return value * (typeof window !== "undefined" ? window.innerWidth  : 1200) / 100
	if (unit === "vh") return value * (typeof window !== "undefined" ? window.innerHeight : 800) / 100
	return value
}

/** Convert from px back to a target unit so we can preserve visual size on unit switch. */
function fromPx(px: number, unit: SizeUnit): number {
	if (unit === "px")  return px
	if (unit === "pt")  return px * (72 / 96)
	if (unit === "em" || unit === "rem") {
		const rootPx = typeof document !== "undefined"
			? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
			: 16
		return px / rootPx
	}
	if (unit === "vw") return px / ((typeof window !== "undefined" ? window.innerWidth  : 1200) / 100)
	if (unit === "vh") return px / ((typeof window !== "undefined" ? window.innerHeight : 800) / 100)
	return px
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TEXT  = "TYPE"
const DEFAULT_SHAPE = "flag"  as WrapTypeShape
const DEFAULT_FILL  = "cover" as WrapTypeFill
const FONT_FAMILY   = "Inter, sans-serif"
const FONT_WEIGHT   = 900

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

// ─── Icons ────────────────────────────────────────────────────────────────────

function UploadIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
			<polyline points="17 8 12 3 7 8"/>
			<line x1="12" y1="3" x2="12" y2="15"/>
		</svg>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Demo() {
	const [text,    setText]    = useState(DEFAULT_TEXT)
	const [shape,   setShape]   = useState<WrapTypeShape>(DEFAULT_SHAPE)
	const [fill,    setFill]    = useState<WrapTypeFill>(DEFAULT_FILL)
	const [autoRot, setAutoRot] = useState(true)
	const [repeat,  setRepeat]  = useState(true)
	const [curve,   setCurve]   = useState(0)

	// Size: value in selected unit, separate unit state
	const [sizeValue, setSizeValue] = useState(144)
	const [sizeUnit,  setSizeUnit]  = useState<SizeUnit>("px")

	// Derived pixel value for the scene
	const fontSizePx = toPx(sizeValue, sizeUnit)

	// 3D mesh drop state
	const [meshPositions, setMeshPositions] = useState<CharPosition[] | null>(null)
	const [meshName,      setMeshName]      = useState<string | null>(null)
	const [meshError,     setMeshError]     = useState<string | null>(null)
	const [meshLoading,   setMeshLoading]   = useState(false)
	const [isDragging,    setIsDragging]    = useState(false)

	const fileInputRef = useRef<HTMLInputElement>(null)
	const dText = useDeferredValue(text)

	// ── Unit switching — preserve visual size ──────────────────────────────

	function changeUnit(newUnit: SizeUnit) {
		const currentPx = toPx(sizeValue, sizeUnit)
		const cfg       = UNIT_CFG[newUnit]
		const converted = fromPx(currentPx, newUnit)
		const stepped   = Math.round(converted / cfg.step) * cfg.step
		const clamped   = Math.min(cfg.max, Math.max(cfg.min, stepped))
		setSizeValue(Number(clamped.toFixed(cfg.decimals + 2)))
		setSizeUnit(newUnit)
	}

	// ── 3D file loading ────────────────────────────────────────────────────

	async function loadFile(file: File) {
		const ext = file.name.split(".").pop()?.toLowerCase()
		if (!["glb", "gltf", "obj"].includes(ext ?? "")) {
			setMeshError("Only .glb, .gltf, and .obj files are supported.")
			return
		}
		setMeshError(null)
		setMeshLoading(true)
		const url = URL.createObjectURL(file)
		try {
			let firstMesh: Mesh | null = null
			if (ext === "glb" || ext === "gltf") {
				const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js")
				const loader = new GLTFLoader()
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const gltf = await new Promise<any>((res, rej) => loader.load(url, res, undefined, rej))
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				gltf.scene.traverse((child: any) => { if (!firstMesh && child instanceof Mesh) firstMesh = child })
			} else {
				const { OBJLoader } = await import("three/addons/loaders/OBJLoader.js")
				const loader = new OBJLoader()
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const obj = await new Promise<any>((res, rej) => loader.load(url, res, undefined, rej))
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				obj.traverse((child: any) => { if (!firstMesh && child instanceof Mesh) firstMesh = child })
			}
			if (!firstMesh) { setMeshError("No mesh found. Merge all objects into one before exporting."); return }
			const positions = getCharPositionsFromMesh(firstMesh, dText || "TYPE", { radius: 300 }, 250)
			setMeshPositions(positions)
			setMeshName(file.name)
		} catch {
			setMeshError("Failed to load the file. Check the format and try again.")
		} finally {
			URL.revokeObjectURL(url)
			setMeshLoading(false)
		}
	}

	// ── Drag-and-drop ──────────────────────────────────────────────────────

	const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true)  }, [])
	const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
	const handleDrop = useCallback(async (e: React.DragEvent) => {
		e.preventDefault(); setIsDragging(false)
		const file = e.dataTransfer.files[0]; if (file) await loadFile(file)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dText])

	const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]; if (file) await loadFile(file); e.target.value = ""
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dText])

	const clearMesh = useCallback(() => { setMeshPositions(null); setMeshName(null); setMeshError(null) }, [])

	const sceneShape = meshPositions ? "sphere" : shape

	// ── Size label ─────────────────────────────────────────────────────────

	const cfg = UNIT_CFG[sizeUnit]
	const displayValue = sizeValue.toFixed(cfg.decimals)
	const pxHint = sizeUnit !== "px" ? ` ≈ ${Math.round(fontSizePx)}px` : ""
	const sizeLabel = `${displayValue} ${sizeUnit}${pxHint}`

	return (
		<div className="w-full flex flex-col gap-6">

			{/* 3D scene — drag-drop target */}
			<div
				className={`rounded-xl overflow-hidden relative transition-all ${isDragging ? "ring-2 ring-white/40" : ""}`}
				style={{ height: "500px", background: "rgba(0,0,0,0.4)" }}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<WrapTypeScene
					text={dText}
					shape={sceneShape}
					fill={fill}
					fontSize={fontSizePx}
					fontFamily={FONT_FAMILY}
					fontWeight={FONT_WEIGHT}
					radius={300}
					color="rgba(220,210,255,0.9)"
					autoRotate={autoRot}
					autoRotateSpeed={0.5}
					repeat={repeat}
					characterCurve={curve}
					positions={meshPositions ?? undefined}
					style={{ width: "100%", height: "100%" }}
				/>

				{isDragging && (
					<div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: "rgba(0,0,0,0.3)" }}>
						<p className="text-white/80 text-sm tracking-widest uppercase">Drop to wrap</p>
					</div>
				)}
				{meshLoading && (
					<div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: "rgba(0,0,0,0.4)" }}>
						<p className="text-white/60 text-xs tracking-widest uppercase">Loading mesh…</p>
					</div>
				)}
				{meshName && !isDragging && (
					<div className="absolute top-3 left-3 flex items-center gap-2">
						<span className="text-xs opacity-40 font-mono">{meshName}</span>
						<button onClick={clearMesh} className="text-xs opacity-25 hover:opacity-60 transition-opacity leading-none" aria-label="Clear custom mesh">✕</button>
					</div>
				)}
				{!meshPositions && !isDragging && !meshLoading && (
					<>
						<input ref={fileInputRef} type="file" accept=".glb,.gltf,.obj" className="hidden" aria-label="Load 3D file" onChange={handleFileInput} />
						<button
							onClick={() => fileInputRef.current?.click()}
							className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 text-xs opacity-30 hover:opacity-60 transition-opacity"
							style={{ border: "1.5px dashed currentColor", borderRadius: "6px" }}
						>
							<UploadIcon />
							Drop or click — .glb / .gltf / .obj
						</button>
					</>
				)}
			</div>

			{meshError && (
				<p className="text-xs opacity-70" style={{ color: "rgba(255,120,120,0.9)" }}>{meshError}</p>
			)}

			{/* Controls */}
			<div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs transition-opacity ${meshPositions ? "opacity-30 pointer-events-none select-none" : ""}`}>

				{/* Shape */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">Shape</span>
					<div className="flex gap-2 flex-wrap">
						{SHAPES.map(s => (
							<button key={s.value} onClick={() => setShape(s.value)}
								className={`px-3 py-1.5 rounded-full border transition-colors ${shape === s.value ? "border-white/60 bg-white/10" : "border-white/20 hover:border-white/40"}`}>
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
							<button key={f.value} onClick={() => setFill(f.value)}
								className={`px-3 py-1.5 rounded-full border transition-colors ${fill === f.value ? "border-white/60 bg-white/10" : "border-white/20 hover:border-white/40"}`}>
								{f.label}
							</button>
						))}
					</div>
				</div>

				{/* Size — value slider + unit picker */}
				<div className="flex flex-col gap-2 sm:col-span-2">
					<div className="flex items-baseline justify-between">
						<span className="uppercase tracking-widest opacity-50">Size — {sizeLabel}</span>
						<div className="flex gap-1">
							{SIZE_UNITS.map(u => (
								<button
									key={u}
									onClick={() => changeUnit(u)}
									className={`px-2 py-0.5 rounded text-xs transition-colors font-mono ${
										sizeUnit === u
											? "bg-white/15 opacity-100"
											: "opacity-30 hover:opacity-60"
									}`}
								>
									{u}
								</button>
							))}
						</div>
					</div>
					<input
						type="range"
						min={cfg.min}
						max={cfg.max}
						step={cfg.step}
						value={sizeValue}
						onChange={e => setSizeValue(Number(e.target.value))}
						aria-label={`Font size in ${sizeUnit}`}
						className="w-full accent-white/60"
					/>
				</div>

				{/* Auto-rotate */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">Rotation</span>
					<button onClick={() => setAutoRot(r => !r)}
						className={`w-fit px-3 py-1.5 rounded-full border transition-colors ${autoRot ? "border-white/60 bg-white/10" : "border-white/20 hover:border-white/40"}`}>
						{autoRot ? "Auto-rotating" : "Paused"}
					</button>
				</div>

				{/* Repeat */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">Repeat</span>
					<button onClick={() => setRepeat(r => !r)}
						className={`w-fit px-3 py-1.5 rounded-full border transition-colors ${repeat ? "border-white/60 bg-white/10" : "border-white/20 hover:border-white/40"}`}>
						{repeat ? "Tiling" : "Once"}
					</button>
				</div>

				{/* Character curve */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">Character curve — {Math.round(curve * 100)}%</span>
					<input
						type="range" min={0} max={100} step={1} value={Math.round(curve * 100)}
						onChange={e => setCurve(Number(e.target.value) / 100)}
						aria-label="Character curve amount"
						className="w-full accent-white/60"
					/>
				</div>

				{/* Text */}
				<div className="flex flex-col gap-2">
					<span className="uppercase tracking-widest opacity-50">Text</span>
					<textarea value={text} onChange={e => setText(e.target.value)} rows={1}
						aria-label="Text to wrap on the surface"
						className="w-full bg-white/5 rounded px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-white/20" />
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
