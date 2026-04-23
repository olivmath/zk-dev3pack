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

export default StateBadge
