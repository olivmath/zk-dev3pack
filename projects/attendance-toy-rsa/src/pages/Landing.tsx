import { Link } from "react-router-dom"
import styles from "./Landing.module.css"

const Landing: React.FC = () => {
	return (
		<div className={styles.page}>
			{/* ─── HERO ─── */}
			<section className={`${styles.row} ${styles.hero}`}>
				<div className={styles.heroLeft}>
					<span className={styles.kicker}>Toy RSA · open protocol</span>
					<h1 className={styles.title}>
						Proof of presence,
						<br />
						<em className={styles.titleEm}>signed by hand.</em>
					</h1>
					<p className={styles.lede}>
						An open protocol for recording attendance using RSA done on
						paper. No permission, no signup: <strong>anyone can open a
						class, anyone can join.</strong> You compute your key by hand,
						sign the challenge, and receive a soulbound NFT as proof —
						verified by math, not a server.
					</p>
					<div className={styles.heroCta}>
						<Link to="/host" className={styles.primaryCta}>
							Open a class →
						</Link>
						<a href="#step-1" className={styles.secondaryCta}>
							How it works ↓
						</a>
					</div>
				</div>

				<aside className={styles.heroRight} aria-hidden="true">
					<HeroPaper />
				</aside>
			</section>

			{/* ─── STEP 1 — Compute on paper ─── */}
			<Step
				id="step-1"
				index="01"
				kicker="Step 1 · The paper"
				title="Each participant generates their"
				titleEm="(n, e, d)"
				body={
					<>
						Before joining, you forge your own key. Pick two small primes{" "}
						<code>p</code> and <code>q</code> (e.g. 7 and 11), multiply to
						get <code>n = 77</code>, compute <code>φ(n) = 60</code>, choose
						an <code>e</code> coprime with <code>φ</code>, and find{" "}
						<code>d</code> such that <code>e · d ≡ 1 (mod φ)</code>. The{" "}
						<code>d</code> is never typed anywhere — it stays on your paper.
					</>
				}
				image={<PaperKey />}
				orientation="text-left"
			/>

			{/* ─── STEP 2 — Register the public key ─── */}
			<Step
				id="step-2"
				index="02"
				kicker="Step 2 · On-chain"
				title="Register only the"
				titleEm="public part"
				body={
					<>
						Connect your wallet, paste the class ID someone shared, and send
						the contract just the <code>(n, e)</code> pair — the public
						half. The Soroban contract pins your key to your address.
						You're in the roll call without revealing anything about your{" "}
						<code>d</code>.
					</>
				}
				image={<RegisterPaper />}
				orientation="text-right"
			/>

			{/* ─── STEP 3 — Receive the challenge ─── */}
			<Step
				id="step-3"
				index="03"
				kicker="Step 3 · Challenge"
				title="Everyone gets a random"
				titleEm="m"
				body={
					<>
						When registration closes, the host calls{" "}
						<code>issue_challenges</code> and the contract draws a different{" "}
						<code>m</code> for each participant. Yours appears on the screen
						at giant scale — it's the number you must sign to prove you're
						here.
					</>
				}
				image={<ChallengePaper />}
				orientation="text-left"
			/>

			{/* ─── STEP 4 — Sign by hand ─── */}
			<Step
				id="step-4"
				index="04"
				kicker="Step 4 · The pen"
				title="Sign it by hand"
				titleEm="s = m^d mod n"
				body={
					<>
						Back to paper: take the <code>m</code> that appeared, raise it to{" "}
						<code>d</code>, take the remainder mod <code>n</code>. The
						leftover number is your signature <code>s</code>. You only type{" "}
						<code>s</code> in the app — the contract runs{" "}
						<code>s^e mod n</code> and checks it matches the original{" "}
						<code>m</code>. If it does, attendance confirmed.
					</>
				}
				image={<SignPaper />}
				orientation="text-right"
			/>

			{/* ─── STEP 5 — NFT diploma ─── */}
			<Step
				id="step-5"
				index="05"
				kicker="Step 5 · The diploma"
				title="The diploma is"
				titleEm="soulbound"
				body={
					<>
						The host calls <code>close_aula</code>. For each participant
						with a valid signature, the contract mints a non-transferable
						token, bound forever to that specific class. Your proof of
						presence doesn't depend on a password, a camera, a roll sheet
						or any authority — only on <code>s^e mod n = m</code>.
					</>
				}
				image={<DiplomaPaper />}
				orientation="text-left"
			/>

			{/* ─── END CTA ─── */}
			<section className={styles.endCta}>
				<span className="kicker">That's it</span>
				<h2 className={styles.endTitle}>
					Toy RSA, <em>open to anyone</em>.
				</h2>
				<p className={styles.endLede}>
					Five steps, three multiplications, one remainder. No permission, no
					signup, no hierarchy: anyone opens a class, anyone joins. Welcome
					to the most analog attendance protocol that ever touched a
					blockchain.
				</p>

				<div className={styles.endRow}>
					<Link to="/host" className={styles.primaryCta}>
						Open a class →
					</Link>
					<Link to="/join" className={styles.secondaryCta}>
						Join via class link →
					</Link>
				</div>

				<p className={styles.warning}>
					<span className={styles.warningTag}>caveat</span>
					Toy RSA with <code>n &lt; 100</code> is mathematically correct but{" "}
					<strong>cryptographically broken in seconds.</strong> It's only for
					teaching the mechanism — don't use it for anything real.
				</p>
			</section>
		</div>
	)
}

// ─────────── Step block ───────────

const Step: React.FC<{
	id: string
	index: string
	kicker: string
	title: string
	titleEm: string
	body: React.ReactNode
	image: React.ReactNode
	orientation: "text-left" | "text-right"
}> = ({ id, index, kicker, title, titleEm, body, image, orientation }) => (
	<section
		id={id}
		className={`${styles.row} ${styles.step} ${
			orientation === "text-right" ? styles.stepReverse : ""
		}`}
	>
		<div className={styles.stepText}>
			<span className={styles.stepIndex}>{index}</span>
			<span className={styles.kicker}>{kicker}</span>
			<h2 className={styles.stepTitle}>
				{title} <em>{titleEm}</em>
			</h2>
			<p className={styles.stepBody}>{body}</p>
		</div>
		<div className={styles.stepImage} aria-hidden="true">
			{image}
		</div>
	</section>
)

// ─────────── Decorative SVG papers ───────────

const PaperBackground: React.FC<{ rot?: number; children: React.ReactNode }> = ({
	rot = 0,
	children,
}) => (
	<svg
		viewBox="0 0 320 380"
		className={styles.paperSvg}
		style={{ transform: `rotate(${rot}deg)` }}
	>
		<defs>
			<pattern id="lines-bg" width="320" height="22" patternUnits="userSpaceOnUse">
				<line x1="0" y1="21" x2="320" y2="21" stroke="rgba(196,184,154,0.55)" strokeWidth="0.6" />
			</pattern>
		</defs>
		<rect x="6" y="6" width="308" height="368" fill="rgba(255,251,240,0.7)" stroke="rgba(26,23,20,0.18)" strokeWidth="1.2" />
		<rect x="6" y="6" width="308" height="368" fill="url(#lines-bg)" />
		<line x1="38" y1="6" x2="38" y2="374" stroke="rgba(184,52,31,0.55)" strokeWidth="1" />
		{children}
	</svg>
)

const HeroPaper: React.FC = () => (
	<PaperBackground rot={2.4}>
		<text x="58" y="66" fontFamily="Fraunces, serif" fontSize="22" fontStyle="italic" fill="#1a1714">
			p · q = n
		</text>
		<text x="58" y="106" fontFamily="JetBrains Mono, monospace" fontSize="20" fill="#1a1714">
			7 · 11 = <tspan fontWeight="700">77</tspan>
		</text>
		<text x="58" y="156" fontFamily="Fraunces, serif" fontSize="22" fontStyle="italic" fill="#1a1714">
			φ(n) = (p−1)(q−1)
		</text>
		<text x="58" y="196" fontFamily="JetBrains Mono, monospace" fontSize="20" fill="#1a1714">
			= 6 · 10 = 60
		</text>
		<text x="58" y="246" fontFamily="Fraunces, serif" fontSize="22" fontStyle="italic" fill="#1a1714">
			e · d ≡ 1 (mod φ)
		</text>
		<text x="58" y="286" fontFamily="JetBrains Mono, monospace" fontSize="20" fill="#1a1714">
			7 · 43 = 301 ✓
		</text>
		<g transform="translate(196, 308) rotate(-6)">
			<path d="M 0 14 Q 30 -2 70 6" fill="none" stroke="#b8341f" strokeWidth="2.2" strokeLinecap="round" />
			<text x="2" y="34" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="13" fill="#b8341f">key!</text>
		</g>
		<ellipse cx="155" cy="100" rx="34" ry="14" fill="none" stroke="#b8341f" strokeWidth="1.8" transform="rotate(-3 155 100)" />
	</PaperBackground>
)

const PaperKey: React.FC = () => (
	<PaperBackground rot={-2.2}>
		<text x="58" y="58" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#8a7d6a">
			# pick primes
		</text>
		<text x="58" y="84" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="#1a1714">
			p = <tspan fontWeight="700">7</tspan>
		</text>
		<text x="58" y="116" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="#1a1714">
			q = <tspan fontWeight="700">11</tspan>
		</text>

		<line x1="58" y1="138" x2="262" y2="138" stroke="rgba(26,23,20,0.3)" strokeWidth="0.8" strokeDasharray="2 3" />

		<text x="58" y="168" fontFamily="Fraunces, serif" fontSize="20" fontStyle="italic" fill="#1a1714">
			n = pq = <tspan fontFamily="JetBrains Mono, monospace" fontWeight="700">77</tspan>
		</text>
		<text x="58" y="200" fontFamily="Fraunces, serif" fontSize="20" fontStyle="italic" fill="#1a1714">
			φ = (p−1)(q−1) = <tspan fontFamily="JetBrains Mono, monospace" fontWeight="700">60</tspan>
		</text>

		<line x1="58" y1="222" x2="262" y2="222" stroke="rgba(26,23,20,0.3)" strokeWidth="0.8" strokeDasharray="2 3" />

		<text x="58" y="252" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="#2d4a3a" fontWeight="700">
			e = 7 <tspan fontFamily="Fraunces, serif" fontStyle="italic" fontSize="14" fontWeight="400" fill="#8a7d6a">(public)</tspan>
		</text>
		<text x="58" y="284" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="#b8341f" fontWeight="700">
			d = 43 <tspan fontFamily="Fraunces, serif" fontStyle="italic" fontSize="14" fontWeight="400" fill="#8a7d6a">(secret)</tspan>
		</text>

		<g transform="translate(220, 268) rotate(-8)">
			<path d="M -10 0 L 10 0 M 0 -10 L 0 10" stroke="#b8341f" strokeWidth="2" strokeLinecap="round" />
			<text x="14" y="6" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="12" fill="#b8341f">
				don't type!
			</text>
		</g>
	</PaperBackground>
)

const RegisterPaper: React.FC = () => (
	<PaperBackground rot={2.6}>
		<text x="58" y="58" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#8a7d6a">
			$ contract.register(n, e)
		</text>

		<g transform="translate(58, 84)">
			<rect width="200" height="44" fill="rgba(45,74,58,0.08)" stroke="#2d4a3a" strokeWidth="1.2" />
			<text x="14" y="20" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#2d4a3a" fontWeight="600" letterSpacing="2">
				PUBLIC KEY
			</text>
			<text x="14" y="36" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#1a1714">
				n=77, e=7
			</text>
		</g>

		<g transform="translate(58, 150)">
			<rect width="200" height="44" fill="rgba(184,52,31,0.05)" stroke="rgba(184,52,31,0.5)" strokeWidth="1" strokeDasharray="3 3" />
			<text x="14" y="20" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#b8341f" fontWeight="600" letterSpacing="2">
				SECRET (on paper)
			</text>
			<text x="14" y="36" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#b8341f">
				d=43
			</text>
		</g>

		<text x="58" y="226" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="16" fill="#1a1714">
			↓ goes to the contract
		</text>

		<g transform="translate(58, 252)">
			<rect width="200" height="64" fill="rgba(255,251,240,0.9)" stroke="#1a1714" strokeWidth="1.4" />
			<text x="14" y="22" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#8a7d6a" letterSpacing="2">
				SOROBAN STORAGE
			</text>
			<text x="14" y="40" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#1a1714">
				addr → (n=77, e=7)
			</text>
			<text x="14" y="56" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#1a1714">
				students.push(addr)
			</text>
		</g>

		<g transform="translate(244, 110) rotate(8)">
			<path d="M 0 0 Q -10 12 -2 22" fill="none" stroke="#b8341f" strokeWidth="2" strokeLinecap="round" />
			<polygon points="-2,22 -8,18 0,16" fill="#b8341f" />
		</g>
	</PaperBackground>
)

const ChallengePaper: React.FC = () => (
	<PaperBackground rot={-2.8}>
		<text x="58" y="60" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#8a7d6a" letterSpacing="2">
			STEP · CHALLENGE
		</text>

		<text x="58" y="98" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="18" fill="#1a1714">
			your m has arrived:
		</text>

		<g transform="translate(160, 200)">
			<text textAnchor="middle" fontFamily="Fraunces, serif" fontSize="120" fontWeight="500" fill="#b8341f" letterSpacing="-6">
				m=7
			</text>
		</g>

		<text x="58" y="294" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#8a7d6a">
			# need s such that
		</text>
		<text x="58" y="318" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="#1a1714">
			s^e mod n == m
		</text>

		<g transform="translate(64, 110)">
			<text fontFamily="Fraunces, serif" fontStyle="italic" fontSize="13" fill="#b8341f">✦</text>
		</g>
		<g transform="translate(244, 110)">
			<text fontFamily="Fraunces, serif" fontStyle="italic" fontSize="13" fill="#b8341f">✦</text>
		</g>
	</PaperBackground>
)

const SignPaper: React.FC = () => (
	<PaperBackground rot={2.2}>
		<text x="58" y="58" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#8a7d6a">
			s = m^d mod n
		</text>
		<text x="58" y="86" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#8a7d6a">
			s = 7^43 mod 77
		</text>

		<line x1="58" y1="100" x2="262" y2="100" stroke="rgba(26,23,20,0.25)" strokeWidth="0.8" strokeDasharray="2 3" />

		<text x="58" y="128" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#1a1714">
			7^2  = 49
		</text>
		<text x="58" y="148" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#1a1714">
			7^4  = 2401 ≡ 14
		</text>
		<text x="58" y="168" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#1a1714">
			7^8  ≡ 14^2 ≡ 42
		</text>
		<text x="58" y="188" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#1a1714">
			7^16 ≡ 42^2 ≡ 70
		</text>
		<text x="58" y="208" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#1a1714">
			7^32 ≡ 70^2 ≡ 49
		</text>

		<line x1="58" y1="222" x2="262" y2="222" stroke="rgba(26,23,20,0.25)" strokeWidth="0.8" strokeDasharray="2 3" />

		<text x="58" y="250" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#1a1714">
			43 = 32+8+2+1
		</text>
		<text x="58" y="272" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#1a1714">
			s = 49·42·49·7 mod 77
		</text>

		<g transform="translate(58, 296)">
			<rect width="200" height="48" fill="rgba(184,52,31,0.06)" stroke="#b8341f" strokeWidth="1.4" />
			<text x="100" y="32" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="26" fontWeight="500" fill="#b8341f">
				s = 35
			</text>
		</g>

		<g transform="translate(264, 322) rotate(-4)">
			<text fontFamily="Fraunces, serif" fontStyle="italic" fontSize="14" fill="#b8341f">✓</text>
		</g>
	</PaperBackground>
)

const DiplomaPaper: React.FC = () => (
	<svg viewBox="0 0 320 380" className={styles.paperSvg} style={{ transform: "rotate(-1.6deg)" }}>
		<defs>
			<pattern id="diploma-grain" width="3" height="3" patternUnits="userSpaceOnUse">
				<circle cx="1.5" cy="1.5" r="0.5" fill="rgba(243,236,220,0.04)" />
			</pattern>
		</defs>
		<rect x="6" y="6" width="308" height="368" fill="#2d4a3a" />
		<rect x="6" y="6" width="308" height="368" fill="url(#diploma-grain)" />
		<rect x="18" y="18" width="284" height="344" fill="none" stroke="rgba(243,236,220,0.25)" strokeWidth="1" />
		<rect x="26" y="26" width="268" height="328" fill="none" stroke="rgba(184,137,58,0.4)" strokeWidth="1" strokeDasharray="3 3" />

		<text x="160" y="78" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#d8b56a" letterSpacing="3">
			SOULBOUND TOKEN
		</text>

		<line x1="80" y1="98" x2="240" y2="98" stroke="rgba(216,181,106,0.4)" strokeWidth="0.6" />

		<text x="160" y="156" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="20" fontStyle="italic" fill="#f3ecdc">
			Presence
		</text>

		<g transform="translate(160, 240)">
			<text textAnchor="middle" fontFamily="Fraunces, serif" fontSize="92" fontWeight="500" fill="#d8b56a" letterSpacing="-4">
				#01
			</text>
		</g>

		<line x1="80" y1="282" x2="240" y2="282" stroke="rgba(216,181,106,0.4)" strokeWidth="0.6" />

		<text x="160" y="310" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="13" fill="rgba(243,236,220,0.7)">
			Toy RSA · E2E Class
		</text>
		<text x="160" y="332" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgba(216,181,106,0.7)" letterSpacing="2">
			NON-TRANSFERABLE
		</text>
	</svg>
)

export default Landing
