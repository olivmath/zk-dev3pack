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
						Prova de presença
						<br />
						<em className={styles.titleEm}>assinada à mão.</em>
					</h1>
					<p className={styles.lede}>
						Um protocolo aberto pra registrar presença usando RSA feito no
						papel. Sem permissão, sem cadastro: <strong>qualquer um abre
						uma aula, qualquer um participa.</strong> Você calcula sua chave
						à mão, assina o desafio e recebe um NFT soulbound como prova —
						verificada por matemática, não por servidor.
					</p>
					<div className={styles.heroCta}>
						<Link to="/prof" className={styles.primaryCta}>
							Abrir uma aula →
						</Link>
						<a href="#step-1" className={styles.secondaryCta}>
							Como funciona ↓
						</a>
					</div>
				</div>

				<aside className={styles.heroRight} aria-hidden="true">
					<HeroPaper />
				</aside>
			</section>

			{/* ─── STEP 1 — Calcule no papel ─── */}
			<Step
				id="step-1"
				index="01"
				kicker="Etapa 1 · O papel"
				title="Cada participante gera seu par"
				titleEm="(n, e, d)"
				body={
					<>
						Antes de entrar, você fabrica sua própria chave. Pegue dois
						primos pequenos <code>p</code> e <code>q</code> (ex.: 7 e 11),
						multiplique pra obter <code>n = 77</code>, calcule{" "}
						<code>φ(n) = 60</code>, escolha um <code>e</code> coprimo com{" "}
						<code>φ</code> e ache o <code>d</code> que satisfaz{" "}
						<code>e · d ≡ 1 (mod φ)</code>. O <code>d</code> nunca é
						digitado em lugar nenhum — fica só no seu papel.
					</>
				}
				image={<PaperKey />}
				orientation="text-left"
			/>

			{/* ─── STEP 2 — Registre a chave pública ─── */}
			<Step
				id="step-2"
				index="02"
				kicker="Etapa 2 · On-chain"
				title="Registre só a parte"
				titleEm="pública"
				body={
					<>
						Conecte sua wallet, cole o ID da aula que alguém compartilhou e
						envie pro contrato apenas o par <code>(n, e)</code> — a parte
						pública. O Soroban guarda sua chave junto com seu endereço.
						Pronto: você entrou na chamada sem revelar nada do seu{" "}
						<code>d</code>.
					</>
				}
				image={<RegisterPaper />}
				orientation="text-right"
			/>

			{/* ─── STEP 3 — Receba o desafio ─── */}
			<Step
				id="step-3"
				index="03"
				kicker="Etapa 3 · Desafio"
				title="Cada um recebe um"
				titleEm="m aleatório"
				body={
					<>
						Encerrado o registro, quem criou a aula chama{" "}
						<code>issue_challenges</code> e o contrato sorteia um{" "}
						<code>m</code> diferente pra cada participante. O seu aparece na
						tela em escala gigante — é esse número que precisa ser assinado
						pra valer presença.
					</>
				}
				image={<ChallengePaper />}
				orientation="text-left"
			/>

			{/* ─── STEP 4 — Assine na mão ─── */}
			<Step
				id="step-4"
				index="04"
				kicker="Etapa 4 · A caneta"
				title="Assine na mão"
				titleEm="s = m^d mod n"
				body={
					<>
						De volta ao papel: pegue o <code>m</code> que apareceu, eleve à{" "}
						<code>d</code>, tire o resto por <code>n</code>. O número que
						sobrar é sua assinatura <code>s</code>. Você digita só{" "}
						<code>s</code> no app — o contrato roda{" "}
						<code>s^e mod n</code> e confere se bate com o <code>m</code>{" "}
						original. Bateu, presença confirmada.
					</>
				}
				image={<SignPaper />}
				orientation="text-right"
			/>

			{/* ─── STEP 5 — NFT diploma ─── */}
			<Step
				id="step-5"
				index="05"
				kicker="Etapa 5 · O diploma"
				title="O diploma é"
				titleEm="soulbound"
				body={
					<>
						Quem abriu a aula chama <code>close_aula</code>. Pra cada
						participante com assinatura válida, o contrato emite um token
						não-transferível, vinculado pra sempre àquela aula específica.
						Sua prova de presença não depende de senha, câmera, lista de
						chamada ou autoridade — só de <code>s^e mod n = m</code>.
					</>
				}
				image={<DiplomaPaper />}
				orientation="text-left"
			/>

			{/* ─── CTA FINAL ─── */}
			<section className={styles.endCta}>
				<span className="kicker">É só isso</span>
				<h2 className={styles.endTitle}>
					Toy RSA, <em>aberto pra quem quiser</em>.
				</h2>
				<p className={styles.endLede}>
					Cinco etapas, três multiplicações, um resto de divisão. Sem
					permissão, sem cadastro, sem hierarquia: qualquer um abre uma aula,
					qualquer um entra. Bem-vindo ao protocolo de presença mais
					analógico que já passou por uma blockchain.
				</p>

				<div className={styles.endRow}>
					<Link to="/prof" className={styles.primaryCta}>
						Abrir uma aula →
					</Link>
					<Link to="/aluno" className={styles.secondaryCta}>
						Entrar pelo link da turma →
					</Link>
				</div>

				<p className={styles.warning}>
					<span className={styles.warningTag}>aviso</span>
					Toy RSA com <code>n &lt; 100</code> é matematicamente correto mas{" "}
					<strong>criptograficamente quebrável em segundos.</strong> Serve só
					pra ensinar o mecanismo — não use pra nada real.
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
// Cada um é um "pedaço de caderno" diferente. Mantém o tom editorial.

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
			<text x="2" y="34" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="13" fill="#b8341f">chave!</text>
		</g>
		<ellipse cx="155" cy="100" rx="34" ry="14" fill="none" stroke="#b8341f" strokeWidth="1.8" transform="rotate(-3 155 100)" />
	</PaperBackground>
)

const PaperKey: React.FC = () => (
	<PaperBackground rot={-2.2}>
		<text x="58" y="58" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#8a7d6a">
			# escolha primos
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
			e = 7 <tspan fontFamily="Fraunces, serif" fontStyle="italic" fontSize="14" fontWeight="400" fill="#8a7d6a">(pública)</tspan>
		</text>
		<text x="58" y="284" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="#b8341f" fontWeight="700">
			d = 43 <tspan fontFamily="Fraunces, serif" fontStyle="italic" fontSize="14" fontWeight="400" fill="#8a7d6a">(secreta)</tspan>
		</text>

		<g transform="translate(220, 268) rotate(-8)">
			<path d="M -10 0 L 10 0 M 0 -10 L 0 10" stroke="#b8341f" strokeWidth="2" strokeLinecap="round" />
			<text x="14" y="6" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="12" fill="#b8341f">
				não digite!
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
				SECRET (no papel)
			</text>
			<text x="14" y="36" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#b8341f">
				d=43
			</text>
		</g>

		<text x="58" y="226" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="16" fill="#1a1714">
			↓ vai pro contrato
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
			ETAPA · DESAFIO
		</text>

		<text x="58" y="98" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="18" fill="#1a1714">
			seu m chegou:
		</text>

		<g transform="translate(160, 200)">
			<text textAnchor="middle" fontFamily="Fraunces, serif" fontSize="120" fontWeight="500" fill="#b8341f" letterSpacing="-6">
				m=7
			</text>
		</g>

		<text x="58" y="294" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#8a7d6a">
			# precisa de s tal que
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
			Presença
		</text>

		<g transform="translate(160, 240)">
			<text textAnchor="middle" fontFamily="Fraunces, serif" fontSize="92" fontWeight="500" fill="#d8b56a" letterSpacing="-4">
				#01
			</text>
		</g>

		<line x1="80" y1="282" x2="240" y2="282" stroke="rgba(216,181,106,0.4)" strokeWidth="0.6" />

		<text x="160" y="310" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="13" fill="rgba(243,236,220,0.7)">
			Toy RSA · Turma E2E
		</text>
		<text x="160" y="332" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgba(216,181,106,0.7)" letterSpacing="2">
			NÃO TRANSFERÍVEL
		</text>
	</svg>
)

export default Landing
