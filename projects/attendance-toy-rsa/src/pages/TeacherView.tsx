import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAttendance } from "../hooks/useAttendance"
import type { AulaData } from "attendance"
import styles from "./TeacherView.module.css"

type AulaEntry = { id: bigint; data: AulaData }

const TeacherView: React.FC = () => {
	const { attendance, address, signAndSend } = useAttendance()

	const [aulas, setAulas] = useState<AulaEntry[]>([])
	const [newName, setNewName] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const refresh = useCallback(async () => {
		if (!address) return
		const countTx = await attendance.aula_count()
		const count = Number(countTx.result)
		const entries: AulaEntry[] = []
		for (let i = 1; i <= count; i++) {
			const aulaTx = await attendance.get_aula({ aula_id: BigInt(i) })
			const data = aulaTx.result
			if (data && data.teacher === address) {
				entries.push({ id: BigInt(i), data })
			}
		}
		setAulas(entries)
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
			setSuccess(`Aula criada com ID ${id}. Compartilhe: /aluno?aula=${id}`)
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
					<span className="kicker">Acesso</span>
					<h2 className="sheetTitle">
						Conecte sua <em>wallet</em>
					</h2>
					<p className="sheetSub">
						Use o botão no canto superior direito pra conectar Freighter,
						Albedo, xBull ou Lobstr na rede testnet — depois você pode abrir
						uma aula nova ou ver as que já criou.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="viewWrap">
			<header className="viewHead">
				<span className="kicker">Aulas que você criou</span>
				<h1 className="viewTitle">
					Suas <em>aulas</em>
				</h1>
				<p className="viewSub">
					Abra uma aula nova, lance os desafios <code>m</code>, encerre a
					sessão e o contrato emite os NFTs de presença automaticamente.
				</p>
			</header>

			<section className="sheet">
				<span className="kicker">Nova aula</span>
				<h2 className="sheetTitle">Criar aula</h2>
				<p className="sheetSub">
					Dê um nome reconhecível — depois compartilhe o link gerado com
					quem for participar.
				</p>

				<form
					className={styles.createForm}
					onSubmit={(e) => {
						e.preventDefault()
						void handleCreate()
					}}
				>
					<label className="fieldLabel" htmlFor="newAula">
						Nome da aula
					</label>
					<input
						id="newAula"
						type="text"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder="ex.: Toy RSA · 30/04"
						className="input--paper"
					/>
					<button
						type="submit"
						className="btn btn--primary"
						disabled={loading || !newName.trim()}
					>
						{loading ? "Criando…" : "Criar aula →"}
					</button>
				</form>
			</section>

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

			<section className="sheet">
				<div className={styles.listHeader}>
					<div>
						<span className="kicker">Suas aulas</span>
						<h2 className="sheetTitle">
							Caderno de chamadas
							<span className={styles.count}>({aulas.length})</span>
						</h2>
					</div>
				</div>

				{aulas.length === 0 ? (
					<p className={styles.empty}>
						Nenhuma aula criada ainda. Crie a primeira lá em cima.
					</p>
				) : (
					<ul className={styles.aulaList}>
						{aulas.map((a) => (
							<li key={a.id.toString()}>
								<Link
									to={`/prof/aula/${a.id.toString()}`}
									className={styles.aulaItem}
								>
									<span className={styles.aulaIndex}>
										№{a.id.toString().padStart(2, "0")}
									</span>
									<span className={styles.aulaName}>{a.data.name}</span>
									<span className={styles.aulaMeta}>
										<span>{a.data.students.length} participante(s)</span>
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

const StateBadge: React.FC<{ state: string }> = ({ state }) => {
	const map: Record<string, { cls: string; label: string }> = {
		Registration: { cls: "badge--registration", label: "Registro aberto" },
		Challenging: { cls: "badge--challenging", label: "Desafios lançados" },
		Closed: { cls: "badge--closed", label: "Fechada" },
	}
	const s = map[state] ?? map.Closed
	return <span className={`badge ${s.cls}`}>{s.label}</span>
}

export default TeacherView
