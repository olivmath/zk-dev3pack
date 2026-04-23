import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useAttendance } from "../hooks/useAttendance"
import type { AulaData } from "attendance"
import NftDiploma from "../components/NftDiploma"
import Loading from "../components/Loading"
import StateBadge from "../components/StateBadge"
import Note from "../components/Note"
import ClassListItem from "../components/ClassListItem"
import { padClassId, truncateAddress } from "../util/format"
import styles from "./StudentView.module.css"

const POLL_MS = 3000

type ParticipatedClass = { id: bigint; data: AulaData; nft: bigint | null }

const StudentView: React.FC = () => {
	const [params] = useSearchParams()
	const aulaIdStr = params.get("class") ?? ""
	const aulaId = aulaIdStr ? BigInt(aulaIdStr) : undefined

	// If no class param: render the browse view (list + join form)
	if (!aulaIdStr) {
		return <JoinBrowse />
	}

	return <JoinedClass aulaIdStr={aulaIdStr} aulaId={aulaId} />
}

// ─────────────── Browse view (no class selected) ───────────────

const JoinBrowse: React.FC = () => {
	const { attendance, address } = useAttendance()
	const [classes, setClasses] = useState<ParticipatedClass[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!address) return
		let cancelled = false
		setLoading(true)
		;(async () => {
			try {
				const countTx = await attendance.aula_count()
				const count = Number(countTx.result)
				const out: ParticipatedClass[] = []
				for (let i = 1; i <= count; i++) {
					const id = BigInt(i)
					const aulaTx = await attendance.get_aula({ aula_id: id })
					const data = aulaTx.result
					if (!data || !data.students.includes(address)) continue
					let nft: bigint | null = null
					if (data.state.tag === "Closed") {
						const nftTx = await attendance.get_nft({
							aula_id: id,
							student: address,
						})
						nft = nftTx.result ?? null
					}
					out.push({ id, data, nft })
				}
				if (!cancelled) setClasses(out)
			} finally {
				if (!cancelled) setLoading(false)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [address, attendance])

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
						xBull or Lobstr — then you can browse the classes you've
						joined.
					</p>
				</section>
			</div>
		)
	}

	return (
		<div className="viewWrap">
			<header className="viewHead">
				<span className="kicker">Classes you've joined</span>
				<h1 className="viewTitle">
					Your <em>attendance</em>
				</h1>
				<p className="viewSub">
					Every class you've registered for, plus the diplomas you've
					already collected.
				</p>
			</header>

			<section className="sheet">
				<span className="kicker">Your roll-call history</span>
				<h2 className="sheetTitle">Joined classes</h2>

				{loading && classes.length === 0 ? (
					<Loading
						kicker="Reading"
						title="Looking for your classes"
						hint="Scanning the contract for any class you've joined."
						full={false}
					/>
				) : classes.length === 0 ? (
					<p className="emptyLine">
						You haven't joined any class yet. Get a link from the host to
						join one.
					</p>
				) : (
					<ul className="classList">
						{classes.map((c) => (
							<li key={c.id.toString()}>
								<ClassListItem
									to={`/join?class=${c.id.toString()}`}
									id={c.id}
									name={c.data.name}
									meta={
										c.nft !== null ? (
											<span className="badge badge--valid">
												NFT #{c.nft.toString()}
											</span>
										) : (
											<StateBadge state={c.data.state.tag} />
										)
									}
								/>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	)
}

// ─────────────── Joined class (with class param) ───────────────

const JoinedClass: React.FC<{
	aulaIdStr: string
	aulaId: bigint | undefined
}> = ({ aulaIdStr, aulaId }) => {

	const { attendance, address, signAndSend } = useAttendance()

	const [aula, setAula] = useState<AulaData | null>(null)
	const [challenge, setChallenge] = useState<number | null>(null)
	// undefined = not fetched yet, null = no NFT for this user
	const [nftToken, setNftToken] = useState<bigint | null | undefined>(undefined)
	const [pubkey, setPubkey] = useState<{ n: number; e: number } | null>(null)
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
				const pkTx = await attendance.get_pubkey({
					aula_id: aulaId,
					student: address,
				})
				if (pkTx.result) {
					setPubkey({ n: pkTx.result.n, e: pkTx.result.e })
				}
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
				<Loading
					kicker={`Class №${padClassId(aulaIdStr)}`}
					title="Loading the class"
					hint="Reading state, challenge and your token from the contract."
				/>
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
						<span className="kicker">Class №{padClassId(aulaIdStr)}</span>
						<h1 className="viewTitle">{aula.name}</h1>
					</div>
					<StateBadge state={stateLabel} />
				</div>
				<p className={styles.walletLine}>
					Your wallet: <code className="addr">{truncateAddress(address)}</code>
				</p>
			</header>

			{error && <Note variant="error">{error}</Note>}
			{success && <Note variant="success">{success}</Note>}

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

			{/* ─── Class closed: still fetching the NFT ─── */}
			{stateLabel === "Closed" && nftToken === undefined && (
				<Loading
					kicker="Class closed"
					title="Reading your token"
					hint="Checking the contract for your soulbound NFT."
				/>
			)}

			{/* ─── Class closed with NFT ─── */}
			{stateLabel === "Closed" && nftToken && address && (
				<NftDiploma
					tokenId={nftToken.toString()}
					classId={aulaIdStr}
					className={aula.name}
					participant={address}
					m={challenge}
					n={pubkey?.n ?? null}
					e={pubkey?.e ?? null}
				/>
			)}

			{/* ─── Class closed without NFT ─── */}
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

export default StudentView
