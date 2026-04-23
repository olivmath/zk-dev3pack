type NoteVariant = "error" | "success" | "info"

const TAGS: Record<NoteVariant, string> = {
	error: "error",
	success: "ok",
	info: "info",
}

const Note: React.FC<{
	variant: NoteVariant
	children: React.ReactNode
}> = ({ variant, children }) => (
	<div className={`note note--${variant}`}>
		<span className="note__tag">{TAGS[variant]}</span>
		<span>{children}</span>
	</div>
)

export default Note
