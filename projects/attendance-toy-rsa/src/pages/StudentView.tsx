import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useAttendance } from "../hooks/useAttendance"
import type { AulaData } from "attendance"
import styles from "./StudentView.module.css"

const POLL_MS = 3000

const StudentView: React.FC = () => {
	const [params] = useSearchParams()
	const aulaIdStr = params.get("aula") ?? ""
	const aulaId = aulaIdStr ? BigInt(aulaIdStr) : undefined

	const { attendance, address, signAndSend } = useAttendance()

	const [aula, setAula] = useState<AulaData | null>(null)
	const [challenge, setChallenge] = useState<number | null>(null)
	const [nftToken, setNftToken] = useState<bigint | null>(null)
	const [isRegistered, setIsRegistered] = useState(false)
	const [hasValidSub, setHasValidSub] = useState(false)

	const [n, setN] = useState("77")
	const [e, setE] = useState("7")
	const [s, setS] = useState("")

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const refresh = useCallback(async () => {
		if (aulaId === undefined) return
		try {
			const aulaTx = await attendance.get_aula({ aula_id: aulaId })
			const aulaData = aulaTx.result ?? null
			setAula(aulaData)
			if (!address || !aulaData) return
			const registered = aulaData.students.includes(address)
			setIsRegistered(registered)
			if (aulaData.state.tag !== "Registration") {
				const chTx = await attendance.get_challenge({
					aula_id: aulaId,
					student: address,
				})
				setChallenge(chTx.result ?? null)
				const valTx = await attendance.has_valid_sub({
					aula_id: aulaId,
					student: address,
				})
				setHasValidSub(!!valTx.result)
			}
			if (aulaData.state.tag === "Closed") {
				const nftTx = await attendance.get_nft({
					aula_id: aulaId,
					student: address,
				})
				setNftToken(nftTx.result ?? null)
			}
		} catch (err) {
			console.error("refresh error", err)
		}
	}, [aulaId, address, attendance])

	useEffect(() => {
		void refresh()
		const id = setInterval(() => void refresh(), POLL_MS)
		return () => clearInterval(id)
	}, [refresh])

	const handleRegister = async () => {
		if (!address || aulaId === undefined) return
		setLoading(true)
		setError(null)
		try {
			const tx = await attendance.register({
				caller: address,
				aula_id: aulaId,
				n: parseInt(n, 10),
				e: parseInt(e, 10),
			})
			await signAndSend(tx)
			setSuccess("Chave registrada — você está na chamada.")
			await refresh()
		} catch (err: unknown) {
			setError(String(err))
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = async () => {
		if (!address || aulaId === undefined) return
		setLoading(true)
		setError(null)
		try {
			const tx = await attendance.submit_signature({
				caller: address,
				aula_id: aulaId,
				s: parseInt(s, 10),
			})
			await signAndSend(tx)
			setSuccess(`Assinatura aceita: ${s}^${e} mod ${n} = ${challenge}.`)
			await refresh()
		} catch (err: unknown) {
			const msg = String(err)
			setError(
				msg.includes("InvalidSignature")
					? `Assinatura inválida. ${s}^${e} mod ${n} ≠ ${challenge}. Confira a conta.`
					: msg,
			)
		} finally {
			setLoading(false)
		}
	}

	// ─── Estados-guarda ───
	if (!aulaId) {
		return (
			<div className="viewWrap">
				<section className={`sheet ${styles.guard}`}>
					<span className="kicker">Sem aula</span>
					<h2 className="sheetTitle">Você precisa do link da aula</h2>
					<p className="sheetSub">
						Volte pra <a href="/">tela inicial</a> ou cole o link completo
						que alguém compartilhou (com <code>?aula=N</code> no fim).
					</p>
				</section>
			</div>
		)
	}

	if (!address) {
		return (
			<div className="viewWrap">
				<section className={`sheet ${styles.guard}`}>
					<span className="kicker">Acesso</span>
					<h2 className="sheetTitle">
						Conecte sua <em>wallet</em>
					</h2>
					<p className="sheetSub">
						Use o botão no canto superior direito pra conectar Freighter,
						Albedo, xBull ou Lobstr — depois você pode entrar na aula.
					</p>
				</section>
			</div>
		)
	}

	if (!aula) {
		return (
			<div className="viewWrap">
				<section className={`sheet sheet--soft ${styles.guard}`}>
					<p className={styles.loading}>
						Carregando aula <strong>№{aulaIdStr}</strong>…
					</p>
				</section>
			</div>
		)
	}

	const stateLabel = aula.state.tag

	return (
		<div className="viewWrap">
			{/* Header da aula */}
			<header className="viewHead">
				<div className={styles.headRow}>
					<div>
						<span className="kicker">
							Aula №{aulaIdStr.padStart(2, "0")}
						</span>
						<h1 className="viewTitle">{aula.name}</h1>
					</div>
					<StateBadge state={stateLabel} />
				</div>
				<p className={styles.walletLine}>
					Sua wallet:{" "}
					<code className="addr">
						{address.slice(0, 8)}…{address.slice(-6)}
					</code>
				</p>
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

			{/* ─── Estado: Registration / não registrado ─── */}
			{stateLabel === "Registration" && !isRegistered && (
				<section className="sheet">
					<span className="kicker">Etapa 1 · Registro</span>
					<h2 className="sheetTitle">Registre sua chave pública</h2>
					<p className="sheetSub">
						Calcule seu par <code>(n, e, d)</code> à mão. Envie só
						<code> (n, e)</code>. O <code>d</code> fica no papel — não
						digite em lugar nenhum.
					</p>

					<div className={styles.keyGrid}>
						<div>
							<label className="fieldLabel" htmlFor="kn">n (módulo)</label>
							<input
								id="kn"
								type="number"
								value={n}
								onChange={(ev) => setN(ev.target.value)}
								className="input--paper"
							/>
						</div>
						<div>
							<label className="fieldLabel" htmlFor="ke">e (expoente público)</label>
							<input
								id="ke"
								type="number"
								value={e}
								onChange={(ev) => setE(ev.target.value)}
								className="input--paper"
							/>
						</div>
						<button
							type="button"
							className="btn btn--primary"
							onClick={() => void handleRegister()}
							disabled={loading || !n || !e}
						>
							{loading ? "Registrando…" : "Registrar →"}
						</button>
					</div>
				</section>
			)}

			{/* ─── Registrado, aguardando ─── */}
			{stateLabel === "Registration" && isRegistered && (
				<section className="sheet">
					<span className="kicker">Etapa 1 · Concluída</span>
					<h2 className="sheetTitle">
						Registrado <em>✓</em>
					</h2>
					<p className="sheetSub">
						Sua chave pública está no contrato. Aguarde quem criou a aula
						lançar o desafio.
					</p>
					<p className={styles.fineLine}>
						{aula.students.length} participante(s) na chamada até agora.
					</p>
				</section>
			)}

			{/* ─── Desafio chegou ─── */}
			{stateLabel === "Challenging" && challenge !== null && !hasValidSub && (
				<section className="sheet">
					<span className="kicker">Etapa 2 · Desafio</span>
					<h2 className="sheetTitle">Seu desafio chegou</h2>
					<p className="sheetSub">
						Calcule <code>s = m<sup>d</sup> mod n</code> usando o{" "}
						<code>d</code> do papel.
					</p>

					<div className={styles.challengeStage}>
						<div className={styles.challengeFormula}>
							<span className={styles.challengeLabel}>m =</span>
							<span className={styles.challengeM}>{challenge}</span>
						</div>
					</div>

					<div className={styles.signGrid}>
						<div>
							<label className="fieldLabel" htmlFor="sin">
								Assinatura s
							</label>
							<input
								id="sin"
								type="number"
								value={s}
								onChange={(ev) => setS(ev.target.value)}
								placeholder="digite o valor de s"
								className="input--paper"
							/>
						</div>
						<button
							type="button"
							className="btn btn--primary"
							onClick={() => void handleSubmit()}
							disabled={loading || !s}
						>
							{loading ? "Assinando…" : "Assinar →"}
						</button>
					</div>

					<p className={styles.fineLine}>
						Pode tentar quantas vezes quiser até a aula ser encerrada.
					</p>
				</section>
			)}

			{stateLabel === "Challenging" && hasValidSub && (
				<section className="sheet">
					<span className="kicker">Etapa 2 · Concluída</span>
					<h2 className="sheetTitle">
						Assinatura aceita <em>✓</em>
					</h2>
					<p className="sheetSub">
						Aguardando o encerramento da aula pra emitir seu NFT de
						presença.
					</p>
				</section>
			)}

			{stateLabel === "Challenging" && challenge === null && (
				<section className="sheet sheet--soft">
					<p className={styles.loading}>
						Aguardando seu desafio aparecer…
					</p>
				</section>
			)}

			{/* ─── Aula encerrada com NFT ─── */}
			{stateLabel === "Closed" && nftToken !== null && (
				<section className={`sheet sheet--dark ${styles.diploma}`}>
					<span className="kicker" style={{ color: "var(--gold-soft)" }}>
						Diploma · Soulbound
					</span>
					<h2 className="sheetTitle">Presença registrada</h2>

					<div className={styles.nftPlate}>
						<span className={styles.nftHash}>#</span>
						<span className={styles.nftId}>{nftToken.toString()}</span>
					</div>

					<p className={styles.diplomaCaption}>
						<em>{aula.name}</em> · token soulbound emitido pelo contrato
					</p>
				</section>
			)}

			{stateLabel === "Closed" && nftToken === null && (
				<section className="sheet">
					<span className="kicker">Aula encerrada</span>
					<h2 className="sheetTitle">Presença não registrada</h2>
					<p className="sheetSub">
						A aula foi fechada antes da sua assinatura ser aceita.
						Infelizmente sua presença não foi computada nessa sessão.
					</p>
				</section>
			)}
		</div>
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

export default StudentView
