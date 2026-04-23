import styles from "./Loading.module.css"

type LoadingProps = {
	kicker?: string
	title?: string
	hint?: string
	full?: boolean
}

const Loading: React.FC<LoadingProps> = ({
	kicker = "Loading",
	title = "Reading the contract",
	hint = "Talking to Soroban — should take just a moment.",
	full = true,
}) => (
	<section className={`sheet sheet--soft ${full ? styles.fullCard : ""}`}>
		<span className="kicker">{kicker}</span>
		<h2 className="sheetTitle">{title}</h2>
		<p className="sheetSub">{hint}</p>

		<div className={styles.dots} aria-hidden="true">
			<span />
			<span />
			<span />
		</div>
	</section>
)

export default Loading
