// wrapType/site/src/app/opengraph-image.tsx — OG image for wraptype.com
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'wrapType — Live DOM text on any 3D surface'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
	const interLight = await readFile(join(process.cwd(), 'public/fonts/inter-300.woff'))
	return new ImageResponse(
		(
			<div style={{ background: '#0d0d18', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', fontFamily: 'Inter, sans-serif' }}>
				<span style={{ fontSize: 13, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>wrapType</span>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
					{/* Stylised sphere hint — concentric arcs */}
					<div style={{ display: 'flex', marginBottom: 40 }}>
						<svg width="100" height="100" viewBox="0 0 100 100" style={{ opacity: 0.4 }}>
							<circle cx="50" cy="50" r="44" fill="none" stroke="rgba(160,140,255,0.6)" strokeWidth="1.5" />
							<ellipse cx="50" cy="50" rx="26" ry="44" fill="none" stroke="rgba(160,140,255,0.4)" strokeWidth="1" />
							<ellipse cx="50" cy="50" rx="44" ry="14" fill="none" stroke="rgba(160,140,255,0.4)" strokeWidth="1" />
							{/* Text dots around equator */}
							{[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
								<circle key={i} cx={50 + 44 * Math.cos(deg * Math.PI / 180)} cy={50 + 14 * Math.sin(deg * Math.PI / 180)} r="2.5" fill="rgba(160,140,255,0.7)" />
							))}
						</svg>
					</div>
					<div style={{ fontSize: 76, color: '#ffffff', lineHeight: 1.06, fontWeight: 300 }}>Text on a surface.</div>
					<div style={{ fontSize: 76, color: 'rgba(255,255,255,0.4)', lineHeight: 1.06, fontWeight: 300 }}>Still real DOM.</div>
				</div>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
					<div style={{ fontSize: 14, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em', display: 'flex', gap: 20 }}>
						<span>TypeScript</span><span style={{ opacity: 0.4 }}>·</span>
						<span>Three.js CSS3DRenderer</span><span style={{ opacity: 0.4 }}>·</span>
						<span>React + Vanilla JS</span>
					</div>
					<div style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.04em' }}>wraptype.com</div>
				</div>
			</div>
		),
		{ ...size, fonts: [{ name: 'Inter', data: interLight, style: 'normal', weight: 300 }] },
	)
}
