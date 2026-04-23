import { useCallback, useEffect, useState } from "react"
import { useAttendance } from "../hooks/useAttendance"
import type { AulaData } from "attendance"
import Loading from "../components/Loading"
import StateBadge from "../components/StateBadge"
import Note from "../components/Note"
import ClassListItem from "../components/ClassListItem"
import styles from "./TeacherView.module.css"

type ClassEntry = { id: bigint; data: AulaData }

const TeacherView: React.FC = () => {
	const { attendance, address, signAndSend } = useAttendance()

	const [classes, setClasses] = useState<ClassEntry[]>([])
	const [newName, setNewName] = useState("")
	const [loading, setLoading] = useState(false)
	const [firstLoading, setFirstLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const refresh = useCallback(async () => {
		if (!address) return
		try {
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
		} finally {
			setFirstLoading(false)
		}
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

	if (firstLoading) {
		return (
			<div className="viewWrap">
				<Loading
					kicker="Loading"
					title="Fetching your classes"
					hint="Walking the contract ledger for the classes you've opened."
				/>
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

			{error && <Note variant="error">{error}</Note>}
			{success && <Note variant="success">{success}</Note>}

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
					<p className="emptyLine">
						No class opened yet. Open your first one above.
					</p>
				) : (
					<ul className="classList">
						{classes.map((a) => (
							<li key={a.id.toString()}>
								<ClassListItem
									to={`/host/class/${a.id.toString()}`}
									id={a.id}
									name={a.data.name}
									meta={
										<>
											<span>{a.data.students.length} participant(s)</span>
											<StateBadge state={a.data.state.tag} />
										</>
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

export default TeacherView
