import { Link } from "react-router-dom"
import { padClassId } from "../util/format"

const ClassListItem: React.FC<{
	to: string
	id: bigint | string | number
	name: string
	meta: React.ReactNode
}> = ({ to, id, name, meta }) => (
	<Link to={to} className="classItem">
		<span className="classItem__index">№{padClassId(id)}</span>
		<span className="classItem__name">{name}</span>
		<span className="classItem__meta">{meta}</span>
		<span className="classItem__arrow">→</span>
	</Link>
)

export default ClassListItem
