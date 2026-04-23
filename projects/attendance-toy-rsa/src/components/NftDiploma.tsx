import { useRef, useState } from "react"
import styles from "./NftDiploma.module.css"

type DiplomaProps = {
	tokenId: string
	classId: string
	className: string
	participant: string
	m: number | null
	n: number | null
	e: number | null
}

const NftDiploma: React.FC<DiplomaProps> = (props) => {
	const svgRef = useRef<SVGSVGElement>(null)
	const [status, setStatus] = useState<string | null>(null)

	const download = async () => {
		const svg = svgRef.current
		if (!svg) return
		try {
			setStatus("Rendering…")
			const png = await svgToPng(svg, 1600, 1100)
			const link = document.createElement("a")
			link.download = `presence-class${props.classId}-token${props.tokenId}.png`
			link.href = png
			link.click()
			setStatus("Downloaded ✓")
			setTimeout(() => setStatus(null), 1800)
		} catch (err) {
			console.error(err)
			setStatus("Error — try again")
			setTimeout(() => setStatus(null), 1800)
		}
	}

	return (
		<div className={styles.wrap}>
			<DiplomaSvg svgRef={svgRef} {...props} />

			<div className={styles.actions}>
				<button type="button" className={styles.downloadBtn} onClick={() => void download()}>
					{status ?? "Download PNG ↓"}
				</button>
			</div>
		</div>
	)
}

// ─────────────── SVG (ref'd so we can export) ───────────────

const DiplomaSvg: React.FC<
	DiplomaProps & { svgRef: React.RefObject<SVGSVGElement | null> }
> = ({ svgRef, tokenId, classId, className, participant, m, n, e }) => {
	const shortAddr = `${participant.slice(0, 8)}…${participant.slice(-6)}`

	return (
		<svg
			ref={svgRef}
			viewBox="0 0 800 550"
			className={styles.diplomaSvg}
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<pattern id="diploma-grain-bg" width="3" height="3" patternUnits="userSpaceOnUse">
					<circle cx="1.5" cy="1.5" r="0.5" fill="rgba(243,236,220,0.05)" />
				</pattern>
				<linearGradient id="diploma-sheen" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="rgba(216,181,106,0.12)" />
					<stop offset="1" stopColor="rgba(216,181,106,0)" />
				</linearGradient>
			</defs>

			{/* background — chalkboard green */}
			<rect x="0" y="0" width="800" height="550" fill="#2d4a3a" />
			<rect x="0" y="0" width="800" height="550" fill="url(#diploma-grain-bg)" />
			<rect x="0" y="0" width="800" height="550" fill="url(#diploma-sheen)" />

			{/* borders */}
			<rect x="26" y="26" width="748" height="498" fill="none" stroke="rgba(243,236,220,0.28)" strokeWidth="1.4" />
			<rect x="38" y="38" width="724" height="474" fill="none" stroke="rgba(184,137,58,0.45)" strokeWidth="1" strokeDasharray="4 4" />

			{/* top label */}
			<text x="400" y="88" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#d8b56a" letterSpacing="4">
				PROOF-OF-PRESENCE · SOULBOUND TOKEN
			</text>

			<line x1="220" y1="110" x2="580" y2="110" stroke="rgba(216,181,106,0.4)" strokeWidth="0.8" />

			{/* headline */}
			<text x="400" y="170" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="32" fontStyle="italic" fontWeight="400" fill="#f3ecdc">
				Presence recorded
			</text>
			<text x="400" y="210" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="22" fontStyle="italic" fill="rgba(243,236,220,0.7)">
				{className}
			</text>

			{/* big token id */}
			<text x="400" y="336" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="130" fontWeight="500" fill="#d8b56a" letterSpacing="-5">
				#{tokenId}
			</text>

			<line x1="220" y1="372" x2="580" y2="372" stroke="rgba(216,181,106,0.4)" strokeWidth="0.8" />

			{/* metadata grid */}
			<g fontFamily="JetBrains Mono, monospace" fontSize="13">
				<text x="148" y="408" fill="#d8b56a" letterSpacing="2">CLASS</text>
				<text x="148" y="428" fill="#f3ecdc" fontSize="14">№{classId.padStart(2, "0")}</text>

				<text x="280" y="408" fill="#d8b56a" letterSpacing="2">CHALLENGE</text>
				<text x="280" y="428" fill="#f3ecdc" fontSize="14">
					m = {m ?? "—"}
				</text>

				<text x="420" y="408" fill="#d8b56a" letterSpacing="2">PUBLIC KEY</text>
				<text x="420" y="428" fill="#f3ecdc" fontSize="14">
					{n !== null && e !== null ? `(n=${n}, e=${e})` : "—"}
				</text>

				<text x="592" y="408" fill="#d8b56a" letterSpacing="2">HOLDER</text>
				<text x="592" y="428" fill="#f3ecdc" fontSize="13">
					{shortAddr}
				</text>
			</g>

			{/* footer caption */}
			<line x1="80" y1="472" x2="720" y2="472" stroke="rgba(216,181,106,0.25)" strokeWidth="0.6" />
			<text x="400" y="498" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="14" fill="rgba(243,236,220,0.65)">
				verified by <tspan fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#d8b56a">s^e mod n = m</tspan> on Stellar Soroban
			</text>
			<text x="400" y="520" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="rgba(216,181,106,0.6)" letterSpacing="3">
				NON-TRANSFERABLE · DEV3PACK EDITION
			</text>
		</svg>
	)
}

// ─────────────── SVG → PNG via canvas ───────────────

function svgToPng(svg: SVGSVGElement, width: number, height: number): Promise<string> {
	return new Promise((resolve, reject) => {
		const serializer = new XMLSerializer()
		const source = serializer.serializeToString(svg)
		const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" })
		const url = URL.createObjectURL(svgBlob)

		const img = new Image()
		img.onload = () => {
			const canvas = document.createElement("canvas")
			canvas.width = width
			canvas.height = height
			const ctx = canvas.getContext("2d")
			if (!ctx) {
				URL.revokeObjectURL(url)
				reject(new Error("No 2D canvas context"))
				return
			}
			ctx.drawImage(img, 0, 0, width, height)
			URL.revokeObjectURL(url)
			try {
				resolve(canvas.toDataURL("image/png"))
			} catch (err) {
				reject(err as Error)
			}
		}
		img.onerror = () => {
			URL.revokeObjectURL(url)
			reject(new Error("Failed to rasterize SVG"))
		}
		img.src = url
	})
}

export default NftDiploma
