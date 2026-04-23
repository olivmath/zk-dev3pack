import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAttendance } from "../hooks/useAttendance"
import type { AulaData } from "attendance"
import styles from "./TeacherView.module.css"

type ClassEntry = { id: bigint; data: AulaData }

const TeacherView: React.FC = () => {
	const { attendance, address, signAndSend } = useAttendance()

	const [classes, setClasses] = useState<ClassEntry[]>([])
	const [newName, setNewName] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const refresh = useCallback(async () => {
		if (!address) return
		const countTx = await attendance.aula_count()
		const count = Number(countTx.result)
		const entries: ClassEntry[] = []
		for (let i = 1; i <= count; i++) {
			const aulaTx = await attendance.get_aula({ aula_id: BigInt(i) })
			const data = aulaTx.result
			if (data && data.teacher === address) {
				entries.push({ id: BigInt(i), data })
			}
		}
		setClasses(entries)
	}, [address, attendance])

	useEffect(() => {
		void refresh()
		const id = setInterval(() => void refresh(), 5000)
		return () => clearInterval(id)
	}, [refresh])

	const handleCreate = async () => {
		if (!address || !newName.trim()) return
		setLoading(true)
		setError(null)
		try {
			const tx = await attendance.create_aula({ caller: address, name: newName.trim() })
			const id = await signAndSend(tx)
			setSuccess(`Class #${id} opened. Share link: /join?class=${id}`)
			setNewName("")
			await refresh()
		} catch (err) {
			setError(String(err))
		} finally {
			setLoading(false)
		}
	}

	if (!address) {
		return (
			<div className="viewWrap">
				<div className={`sheet ${styles.connectCard}`}>
					<span className="kicker">Access</span>
					<h2 className="sheetTitle">
						Connect your <em>wallet</em>
					</h2>
					<p className="sheetSub">
						Use the button in the top-right to connect Freighter, Albedo,
						xBull or Lobstr on testnet — then you can open a new class or
						review the ones you've already created.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="viewWrap">
			<header className="viewHead">
				<span className="kicker">Classes you've opened</span>
				<h1 className="viewTitle">
					Your <em>classes</em>
				</h1>
				<p className="viewSub">
					Open a new class, issue the <code>m</code> challenges, close the
					session and the contract mints presence NFTs automatically.
				</p>
			</header>

			<section className="sheet">
				<span className="kicker">New class</span>
				<h2 className="sheetTitle">Open a class</h2>
				<p className="sheetSub">
					Give it a recognizable name — then share the generated link with
					whoever is going to participate.
				</p>

				<form
					className={styles.createForm}
					onSubmit={(e) => {
						e.preventDefault()
						void handleCreate()
					}}
				>
					<label className="fieldLabel" htmlFor="newClass">
						Class name
					</label>
					<input
						id="newClass"
						type="text"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder="e.g. Toy RSA · 04/30"
						className="input--paper"
					/>
					<button
						type="submit"
						className="btn btn--primary"
						disabled={loading || !newName.trim()}
					>
						{loading ? "Opening…" : "Open class →"}
					</button>
				</form>
			</section>

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

			<section className="sheet">
				<div className={styles.listHeader}>
					<div>
						<span className="kicker">Your classes</span>
						<h2 className="sheetTitle">
							Roll-call ledger
							<span className={styles.count}>({classes.length})</span>
						</h2>
					</div>
				</div>

				{classes.length === 0 ? (
					<p className={styles.empty}>
						No class opened yet. Open your first one above.
					</p>
				) : (
					<ul className={styles.aulaList}>
						{classes.map((a) => (
							<li key={a.id.toString()}>
								<Link
									to={`/host/class/${a.id.toString()}`}
									className={styles.aulaItem}
								>
									<span className={styles.aulaIndex}>
										№{a.id.toString().padStart(2, "0")}
									</span>
									<span className={styles.aulaName}>{a.data.name}</span>
									<span className={styles.aulaMeta}>
										<span>{a.data.students.length} participant(s)</span>
										<StateBadge state={a.data.state.tag} />
									</span>
									<span className={styles.aulaArrow}>→</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	)
}

const STATE_LABELS = {
	Registration: { cls: "badge--registration", label: "Registration open" },
	Challenging: { cls: "badge--challenging", label: "Challenges issued" },
	Closed: { cls: "badge--closed", label: "Closed" },
} as const

const StateBadge: React.FC<{ state: string }> = ({ state }) => {
	const s =
		STATE_LABELS[state as keyof typeof STATE_LABELS] ?? STATE_LABELS.Closed
	return <span className={`badge ${s.cls}`}>{s.label}</span>
}

export default TeacherView
