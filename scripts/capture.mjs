// wrapType README visual harness.
// Drives the live Next.js demo (DOM / CSS3DRenderer renderer) with Playwright,
// captures one static PNG per built-in shape plus an animated hero GIF of the
// rotating sphere, and writes everything to assets/.
//
// Reproducible: start the demo, then run this script.
//   1. cd site && PORT=3116 npm run dev        (in one terminal)
//   2. node scripts/capture.mjs                (in another)
//
// Setup once: npx playwright install chromium ; brew install ffmpeg
//
// All images render the real DOM renderer — every character is an HTML <span>
// placed in 3D by CSS3DRenderer, exactly what the package ships.

import { chromium } from "playwright"
import { mkdir, rm, readdir } from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { join } from "node:path"

const BASE = process.env.WRAPTYPE_URL ?? "http://localhost:3116/"
const ASSETS = join(process.cwd(), "assets")
const TMP = join(process.cwd(), ".capture-frames")

// Each scene: the shape button label to click, the text to type, and the
// output PNG name. The demo defaults to the DOM renderer tab.
const SCENES = [
	{ shape: "Sphere",   text: "TYPOGRAPHY", file: "shape-sphere.png",   settle: 900 },
	{ shape: "Cylinder", text: "WRAPTYPE",   file: "shape-cylinder.png", settle: 900 },
]

// The 3D scene element inside the demo (role="img", labelled for a11y).
const SCENE_SELECTOR = '[aria-label*="3D typography"]'

/** Type a new string into the demo's "Text to wrap" textarea. */
async function setText(page, text) {
	const ta = page.locator('textarea[aria-label="Text to wrap on the surface"]').first()
	await ta.fill(text)
	// useDeferredValue + scene rebuild — give it a beat to repaint.
	await page.waitForTimeout(500)
}

/** Click a shape pill by its visible label. */
async function setShape(page, label) {
	await page.getByRole("button", { name: label, exact: true }).first().click()
	await page.waitForTimeout(700)
}

async function main() {
	await mkdir(ASSETS, { recursive: true })
	await rm(TMP, { recursive: true, force: true })
	await mkdir(TMP, { recursive: true })

	const browser = await chromium.launch()
	const page = await browser.newPage({
		viewport: { width: 1100, height: 760 },
		deviceScaleFactor: 2,
	})
	await page.goto(BASE, { waitUntil: "networkidle" })
	await page.evaluate(() => document.fonts.ready)
	await page.waitForTimeout(1200) // let WebGL/CSS3D warm up + variable fonts paint

	// Capture-only: hide the "Drop or click" mesh-upload affordance so it does
	// not intrude on the clean scene shots.
	await page.addStyleTag({
		content: `label[for="mesh-file-input"] { opacity: 0 !important; }`,
	})

	const scene = page.locator(SCENE_SELECTOR).first()
	await scene.waitFor({ state: "visible" })

	// ── Static shape gallery ───────────────────────────────────────────────
	for (const s of SCENES) {
		await setShape(page, s.shape)
		await setText(page, s.text)
		await page.waitForTimeout(s.settle) // settle rotation/wave to a legible angle
		await scene.screenshot({ path: join(ASSETS, s.file) })
		console.log("captured assets/%s", s.file)
	}

	// ── Animated hero: rotating sphere ───────────────────────────────────────
	await setShape(page, "Sphere")
	await setText(page, "TYPOGRAPHY")
	await page.waitForTimeout(600)
	const FRAMES = 60
	const FRAME_MS = 70
	for (let i = 0; i < FRAMES; i++) {
		await scene.screenshot({ path: join(TMP, `f${String(i).padStart(3, "0")}.png`) })
		await page.waitForTimeout(FRAME_MS)
	}
	console.log("captured %d hero frames", FRAMES)

	await browser.close()

	// ── Assemble GIF with ffmpeg (palettegen for clean colour) ───────────────
	const frames = (await readdir(TMP)).filter((f) => f.endsWith(".png")).sort()
	if (frames.length) {
		const palette = join(TMP, "palette.png")
		execFileSync("ffmpeg", [
			"-y", "-framerate", "15", "-i", join(TMP, "f%03d.png"),
			"-vf", "scale=720:-1:flags=lanczos,palettegen=stats_mode=diff", palette,
		], { stdio: "ignore" })
		execFileSync("ffmpeg", [
			"-y", "-framerate", "15", "-i", join(TMP, "f%03d.png"), "-i", palette,
			"-lavfi", "scale=720:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3",
			"-loop", "0", join(ASSETS, "hero.gif"),
		], { stdio: "ignore" })
		console.log("assembled assets/hero.gif")
	}

	await rm(TMP, { recursive: true, force: true })
	console.log("done.")
}

main().catch((err) => { console.error(err); process.exit(1) })
