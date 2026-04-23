import { useCallback, useEffect, useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useAttendance } from "../hooks/useAttendance"
import type { AulaData } from "attendance"
import styles from "./TeacherView.module.css"

const POLL_MS = 4000

const TeacherAulaView: React.FC = () => {
	const { aulaId: aulaIdStr } = useParams<{ aulaId: string }>()
	const navigate = useNavigate()
	const { attendance, address, signAndSend } = useAttendance()

	const aulaId = aulaIdStr ? BigInt(aulaIdStr) : undefined

	const [aula, setAula] = useState<AulaData | null>(null)
	const [mInputs, setMInputs] = useState<Record<string, string>>({})
	const [validSubs, setValidSubs] = useState<Record<string, boolean>>({})
	const [nfts, setNfts] = useState<Record<string, bigint | null>>({})
	const [challenges, setChallenges] = useState<Record<string, number | null>>({})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [copyMsg, setCopyMsg] = useState<string | null>(null)

	const refresh = useCallback(async () => {
		if (aulaId === undefined) return
		try {
			const aulaTx = await attendance.get_aula({ aula_id: aulaId })
			const data = aulaTx.result ?? null
			setAula(data)
			if (!data) return

			const valid: Record<string, boolean> = {}
			const ch: Record<string, number | null> = {}
			const ns: Record<string, bigint | null> = {}
			for (const s of data.students) {
				const v = await attendance.has_valid_sub({ aula_id: aulaId, student: s })
				valid[s] = !!v.result
				if (data.state.tag !== "Registration") {
					const c = await attendance.get_challenge({ aula_id: aulaId, student: s })
					ch[s] = c.result ?? null
				}
				if (data.state.tag === "Closed") {
					const n = await attendance.get_nft({ aula_id: aulaId, student: s })
					ns[s] = n.result ?? null
				}
			}
			setValidSubs(valid)
			setChallenges(ch)
			setNfts(ns)
		} catch (err) {
			console.error("refresh error", err)
		}
	}, [aulaId, attendance])

	useEffect(() => {
		void refresh()
		const id = setInterval(() => void refresh(), POLL_MS)
		return () => clearInterval(id)
	}, [refresh])

	const autoFillAll = useCallback(async () => {
		if (!aula || aulaId === undefined) return
		const out: Record<string, string> = {}
		for (const student of aula.students) {
			const pkTx = await attendance.get_pubkey({ aula_id: aulaId, student })
			const n = pkTx.result?.n ?? 77
			const m = 2 + Math.floor(Math.random() * (n - 2))
			out[student] = m.toString()
		}
		setMInputs(out)
	}, [aula, aulaId, attendance])

	useEffect(() => {
		if (!aula || aula.state.tag !== "Registration") return
		const missing = aula.students.filter((s) => !mInputs[s])
		if (missing.length === 0 || aula.students.length === 0) return
		void autoFillAll()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [aula?.students.length, aula?.state.tag])

	const issue = async () => {
		if (!aula || !address || aulaId === undefined) return
		setLoading(true)
		setError(null)
		try {
			const ms: [string, number][] = aula.students.map((addr) => [
				addr,
				parseInt(mInputs[addr] ?? "0", 10),
			])
			const missing = ms
				.filter(([, m]) => !m || Number.isNaN(m))
				.map(([addr]) => `${addr.slice(0, 6)}…${addr.slice(-4)}`)
			if (missing.length > 0) {
				throw new Error(`Preencha o m pra: ${missing.join(", ")}`)
			}
			const tx = await attendance.issue_challenges({
				caller: address,
				aula_id: aulaId,
				ms,
			})
			await signAndSend(tx)
			await refresh()
		} catch (err) {
			setError(String(err))
		} finally {
			setLoading(false)
		}
	}

	const close = async () => {
		if (!address || aulaId === undefined) return
		setLoading(true)
		setError(null)
		try {
			const tx = await attendance.close_aula({ caller: address, aula_id: aulaId })
			const result = await signAndSend(tx)
			// Result<u64> do stellar-sdk: .unwrap() devolve o bigint, ou simplesmente passa
			const raw = (result as { unwrap?: () => bigint })?.unwrap
				? (result as { unwrap: () => bigint }).unwrap()
				: (result as unknown as bigint)
			const minted = typeof raw === "bigint" ? raw.toString() : String(raw)
			await refresh()
			setSuccess(`${minted} NFT(s) mintado(s).`)
		} catch (err) {
			setError(String(err))
		} finally {
			setLoading(false)
		}
	}

	if (aulaId === undefined) {
		return (
			<div className="viewWrap">
				<section className="sheet">
					<h2 className="sheetTitle">Aula inválida</h2>
					<p className="sheetSub">Volte pro caderno e selecione uma aula.</p>
					<Link to="/prof" className="btn btn--ghost">← Voltar</Link>
				</section>
			</div>
		)
	}

	if (!address) {
		return (
			<div className="viewWrap">
				<section className={`sheet ${styles.connectCard}`}>
					<span className="kicker">Acesso</span>
					<h2 className="sheetTitle">Conecte sua <em>wallet</em></h2>
					<p className="sheetSub">
						Conecte pela barra superior pra gerenciar essa aula — só quem
						criou pode lançar desafios e encerrar.
					</p>
				</section>
			</div>
		)
	}

	if (!aula) {
		return (
			<div className="viewWrap">
				<section className="sheet sheet--soft">
					<p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: "var(--ink-soft)" }}>
						Carregando aula <strong>№{aulaIdStr}</strong>…
					</p>
					<Link to="/prof" className="btn btn--ghost" style={{ marginTop: 16 }}>← Voltar pro caderno</Link>
				</section>
			</div>
		)
	}

	const shareLink = `${window.location.origin}/aluno?aula=${aulaIdStr}`
	const stateLabel = aula.state.tag

	return (
		<div className="viewWrap">
			<header className="viewHead">
				<div style={{ marginBottom: 8 }}>
					<button
						type="button"
						onClick={() => navigate("/prof")}
						className={styles.backLink}
					>
						← Voltar pro caderno
					</button>
				</div>
				<div className={styles.panelHeadHeader}>
					<div>
						<span className="kicker">Aula №{aulaIdStr.padStart(2, "0")}</span>
						<h1 className="viewTitle">{aula.name}</h1>
					</div>
					<StateBadge state={stateLabel} />
				</div>
			</header>

			{error && (
				<div className="note note--error">
					<span className="note__tag">erro</span>
					<span>{error}</span>
				</div>
			)}
			{success && (
				<div className="note note--success">
					<span className="note__tag">ok</span>
					<span>{success}</span>
				</div>
			)}

			{/* Estado: Registro aberto */}
			{stateLabel === "Registration" && (
				<>
					<section className="sheet">
						<span className="kicker">Etapa 1 · Convidar</span>
						<h2 className="sheetTitle">Compartilhe o link da aula</h2>
						<div className={styles.shareBox}>
							<span className="fieldLabel">Link pra participar</span>
							<div className={styles.shareRow}>
								<code className={styles.shareLink}>{shareLink}</code>
								<button
									type="button"
									className="btn btn--sm btn--ghost"
									onClick={() => {
										navigator.clipboard.writeText(shareLink)
										setCopyMsg("Copiado!")
										setTimeout(() => setCopyMsg(null), 1500)
									}}
								>
									{copyMsg ?? "Copiar"}
								</button>
							</div>
						</div>
					</section>

					<section className="sheet">
						<span className="kicker">Etapa 2 · Desafios</span>
						<h2 className="sheetTitle">Defina o <em>m</em> de cada participante</h2>
						<p className="sheetSub">
							Os valores são preenchidos automaticamente — ajuste se quiser.
							Quando estiver pronto, lance os desafios.
						</p>
						<StudentsTable
							students={aula.students}
							mInputs={mInputs}
							setMInputs={setMInputs}
							editable
						/>
						<div className={styles.actions}>
							<button type="button" className="btn btn--ghost" onClick={() => void autoFillAll()}>
								⚡ Auto-fill m's
							</button>
							<button
								type="button"
								className="btn btn--primary"
								onClick={() => void issue()}
								disabled={loading || aula.students.length === 0}
							>
								{loading ? "Lançando…" : "Lançar desafios →"}
							</button>
						</div>
					</section>
				</>
			)}

			{/* Estado: Desafios lançados */}
			{stateLabel === "Challenging" && (
				<section className="sheet">
					<span className="kicker">Etapa 3 · Aguardando</span>
					<h2 className="sheetTitle">Assinaturas em andamento</h2>
					<StudentsTable
						students={aula.students}
						challenges={challenges}
						validSubs={validSubs}
					/>
					<div className={styles.actions}>
						<button
							type="button"
							className="btn btn--danger"
							onClick={() => void close()}
							disabled={loading}
						>
							{loading ? "Fechando…" : "Fechar aula e emitir NFTs"}
						</button>
					</div>
				</section>
			)}

			{/* Estado: Fechada */}
			{stateLabel === "Closed" && (
				<section className="sheet">
					<span className="kicker">Aula encerrada</span>
					<h2 className="sheetTitle">Tokens emitidos</h2>
					<StudentsTable
						students={aula.students}
						challenges={challenges}
						validSubs={validSubs}
						nfts={nfts}
					/>
				</section>
			)}
		</div>
	)
}

// ─────────────── Students table ───────────────

const StudentsTable: React.FC<{
	students: string[]
	mInputs?: Record<string, string>
	setMInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>
	challenges?: Record<string, number | null>
	validSubs?: Record<string, boolean>
	nfts?: Record<string, bigint | null>
	editable?: boolean
}> = ({ students, mInputs, setMInputs, challenges, validSubs, nfts, editable }) => {
	if (students.length === 0) {
		return (
			<p
				style={{
					fontFamily: "var(--font-display)",
					fontStyle: "italic",
					color: "var(--ink-faint)",
					margin: "16px 0 0",
				}}
			>
				Ninguém entrou na aula ainda.
			</p>
		)
	}

	return (
		<table className="tbl" style={{ marginTop: 16 }}>
			<thead>
				<tr>
					<th>№</th>
					<th>participante</th>
					{(editable || challenges) && <th>m</th>}
					{validSubs && <th>status</th>}
					{nfts && <th>token</th>}
				</tr>
			</thead>
			<tbody>
				{students.map((s, idx) => (
					<tr key={s}>
						<td className={styles.studentIdx}>
							{(idx + 1).toString().padStart(2, "0")}
						</td>
						<td>
							<code className="addr">
								{s.slice(0, 8)}…{s.slice(-6)}
							</code>
						</td>
						{(editable || challenges) && (
							<td>
								{editable && setMInputs ? (
									<input
										type="number"
										value={mInputs?.[s] ?? ""}
										onChange={(e) =>
											setMInputs((prev) => ({
												...prev,
												[s]: e.target.value,
											}))
										}
										className="input--inline"
									/>
								) : (
									<span className={styles.challenge}>
										{challenges?.[s] ?? "—"}
									</span>
								)}
							</td>
						)}
						{validSubs && (
							<td>
								{validSubs[s] ? (
									<span className="badge badge--valid">Assinou ✓</span>
								) : (
									<span className="badge badge--pending">Aguardando</span>
								)}
							</td>
						)}
						{nfts && (
							<td>
								{nfts[s] !== null && nfts[s] !== undefined ? (
									<span className="badge badge--valid">
										#{nfts[s]?.toString()}
									</span>
								) : (
									<span className="badge badge--invalid">Faltou</span>
								)}
							</td>
						)}
					</tr>
				))}
			</tbody>
		</table>
	)
}

const StateBadge: React.FC<{ state: string }> = ({ state }) => {
	const map: Record<string, { cls: string; label: string }> = {
		Registration: { cls: "badge--registration", label: "Registro aberto" },
		Challenging: { cls: "badge--challenging", label: "Desafios lançados" },
		Closed: { cls: "badge--closed", label: "Fechada" },
	}
	const m = map[state] ?? map.Closed
	return <span className={`badge ${m.cls}`}>{m.label}</span>
}

export default TeacherAulaView
