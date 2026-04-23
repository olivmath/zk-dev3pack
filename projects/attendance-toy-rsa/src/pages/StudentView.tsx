import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useAttendance } from "../hooks/useAttendance"
import type { AulaData } from "attendance"
import styles from "./StudentView.module.css"

const POLL_MS = 3000

const StudentView: React.FC = () => {
	const [params] = useSearchParams()
	const aulaIdStr = params.get("class") ?? ""
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
			setSuccess("Key registered — you're in the roll call.")
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
			setSuccess(`Signature accepted: ${s}^${e} mod ${n} = ${challenge}.`)
			await refresh()
		} catch (err: unknown) {
			const msg = String(err)
			setError(
				msg.includes("InvalidSignature")
					? `Invalid signature. ${s}^${e} mod ${n} ≠ ${challenge}. Check your math.`
					: msg,
			)
		} finally {
			setLoading(false)
		}
	}

	// ─── Guard states ───
	if (!aulaId) {
		return (
			<div className="viewWrap">
				<section className={`sheet ${styles.guard}`}>
					<span className="kicker">No class</span>
					<h2 className="sheetTitle">You need the class link</h2>
					<p className="sheetSub">
						Go back to <a href="/">the home screen</a> or paste the full
						link someone shared (with <code>?class=N</code> at the end).
					</p>
				</section>
			</div>
		)
	}

	if (!address) {
		return (
			<div className="viewWrap">
				<section className={`sheet ${styles.guard}`}>
					<span className="kicker">Access</span>
					<h2 className="sheetTitle">
						Connect your <em>wallet</em>
					</h2>
					<p className="sheetSub">
						Use the button in the top-right to connect Freighter, Albedo,
						xBull or Lobstr — then you can join the class.
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
						Loading class <strong>№{aulaIdStr}</strong>…
					</p>
				</section>
			</div>
		)
	}

	const stateLabel = aula.state.tag

	return (
		<div className="viewWrap">
			{/* Class header */}
			<header className="viewHead">
				<div className={styles.headRow}>
					<div>
						<span className="kicker">
							Class №{aulaIdStr.padStart(2, "0")}
						</span>
						<h1 className="viewTitle">{aula.name}</h1>
					</div>
					<StateBadge state={stateLabel} />
				</div>
				<p className={styles.walletLine}>
					Your wallet:{" "}
					<code className="addr">
						{address.slice(0, 8)}…{address.slice(-6)}
					</code>
				</p>
			</header>

			{error && (
				<div className="note note--error">
					<span className="note__tag">error</span>
					<span>{error}</span>
				</div>
			)}
			{success && (
				<div className="note note--success">
					<span className="note__tag">ok</span>
					<span>{success}</span>
				</div>
			)}

			{/* ─── State: registration open / not registered ─── */}
			{stateLabel === "Registration" && !isRegistered && (
				<section className="sheet">
					<span className="kicker">Step 1 · Register</span>
					<h2 className="sheetTitle">Register your public key</h2>
					<p className="sheetSub">
						Compute your <code>(n, e, d)</code> by hand. Send only
						<code> (n, e)</code>. The <code>d</code> stays on your paper —
						don't type it anywhere.
					</p>

					<div className={styles.keyGrid}>
						<div>
							<label className="fieldLabel" htmlFor="kn">n (modulus)</label>
							<input
								id="kn"
								type="number"
								value={n}
								onChange={(ev) => setN(ev.target.value)}
								className="input--paper"
							/>
						</div>
						<div>
							<label className="fieldLabel" htmlFor="ke">e (public exponent)</label>
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
							{loading ? "Registering…" : "Register →"}
						</button>
					</div>
				</section>
			)}

			{/* ─── Registered, waiting ─── */}
			{stateLabel === "Registration" && isRegistered && (
				<section className="sheet">
					<span className="kicker">Step 1 · Done</span>
					<h2 className="sheetTitle">
						Registered <em>✓</em>
					</h2>
					<p className="sheetSub">
						Your public key is on the contract. Waiting for the host to
						issue the challenge.
					</p>
					<p className={styles.fineLine}>
						{aula.students.length} participant(s) in the roll call so far.
					</p>
				</section>
			)}

			{/* ─── Challenge arrived ─── */}
			{stateLabel === "Challenging" && challenge !== null && !hasValidSub && (
				<section className="sheet">
					<span className="kicker">Step 2 · Challenge</span>
					<h2 className="sheetTitle">Your challenge has arrived</h2>
					<p className="sheetSub">
						Compute <code>s = m<sup>d</sup> mod n</code> using the{" "}
						<code>d</code> from your paper.
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
								Signature s
							</label>
							<input
								id="sin"
								type="number"
								value={s}
								onChange={(ev) => setS(ev.target.value)}
								placeholder="type the value of s"
								className="input--paper"
							/>
						</div>
						<button
							type="button"
							className="btn btn--primary"
							onClick={() => void handleSubmit()}
							disabled={loading || !s}
						>
							{loading ? "Signing…" : "Sign →"}
						</button>
					</div>

					<p className={styles.fineLine}>
						You can try as many times as you want until the class is closed.
					</p>
				</section>
			)}

			{stateLabel === "Challenging" && hasValidSub && (
				<section className="sheet">
					<span className="kicker">Step 2 · Done</span>
					<h2 className="sheetTitle">
						Signature accepted <em>✓</em>
					</h2>
					<p className="sheetSub">
						Waiting for the class to close so your presence NFT can be
						minted.
					</p>
				</section>
			)}

			{stateLabel === "Challenging" && challenge === null && (
				<section className="sheet sheet--soft">
					<p className={styles.loading}>
						Waiting for your challenge to appear…
					</p>
				</section>
			)}

			{/* ─── Class closed with NFT ─── */}
			{stateLabel === "Closed" && nftToken !== null && (
				<section className={`sheet sheet--dark ${styles.diploma}`}>
					<span className="kicker" style={{ color: "var(--gold-soft)" }}>
						Diploma · Soulbound
					</span>
					<h2 className="sheetTitle">Presence recorded</h2>

					<div className={styles.nftPlate}>
						<span className={styles.nftHash}>#</span>
						<span className={styles.nftId}>{nftToken.toString()}</span>
					</div>

					<p className={styles.diplomaCaption}>
						<em>{aula.name}</em> · soulbound token issued by the contract
					</p>
				</section>
			)}

			{stateLabel === "Closed" && nftToken === null && (
				<section className="sheet">
					<span className="kicker">Class closed</span>
					<h2 className="sheetTitle">Presence not recorded</h2>
					<p className="sheetSub">
						The class was closed before your signature was accepted.
						Unfortunately your presence wasn't counted this time.
					</p>
				</section>
			)}
		</div>
	)
}

const STATE_LABELS = {
	Registration: { cls: "badge--registration", label: "Registration open" },
	Challenging: { cls: "badge--challenging", label: "Challenges issued" },
	Closed: { cls: "badge--closed", label: "Closed" },
} as const

const StateBadge: React.FC<{ state: string }> = ({ state }) => {
	const m =
		STATE_LABELS[state as keyof typeof STATE_LABELS] ?? STATE_LABELS.Closed
	return <span className={`badge ${m.cls}`}>{m.label}</span>
}

export default StudentView
