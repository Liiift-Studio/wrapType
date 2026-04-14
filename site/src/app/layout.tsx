import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: "wrapType — Live DOM text on any 3D surface",
	icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
	description: "Text that wraps a 3D surface — sphere, cylinder, torus, or your own mesh. Real DOM characters, orbit camera, surface and silhouette modes.",
	keywords: ["typography", "3d", "three.js", "mesh", "surface", "css3d", "text-wrap", "webgl", "TypeScript", "npm", "react"],
	openGraph: {
		title: "wrapType — Live DOM text on any 3D surface",
		description: "Real DOM text flowing across a sphere, cylinder, torus, or custom mesh. Surface and silhouette modes, orbit camera.",
		url: "https://wraptype.com",
		siteName: "wrapType",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "wrapType — Live DOM text on any 3D surface",
		description: "Real DOM text flowing across a 3D surface. Surface and silhouette modes.",
	},
	metadataBase: new URL("https://wraptype.com"),
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className="h-full antialiased">
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	)
}
