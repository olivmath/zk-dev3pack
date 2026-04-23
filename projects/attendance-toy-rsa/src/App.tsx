import { Routes, Route, Outlet, Link, useLocation } from "react-router-dom"
import styles from "./App.module.css"
import WalletDropdown from "./components/WalletDropdown"
import Landing from "./pages/Landing"
import StudentView from "./pages/StudentView"
import TeacherView from "./pages/TeacherView"
import TeacherAulaView from "./pages/TeacherAulaView"

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path="/" element={<Landing />} />
				<Route path="/join" element={<StudentView />} />
				<Route path="/host" element={<TeacherView />} />
				<Route path="/host/class/:classId" element={<TeacherAulaView />} />
			</Route>
		</Routes>
	)
}

const AppLayout: React.FC = () => {
	const { pathname } = useLocation()
	const isLanding = pathname === "/"

	return (
		<div className={styles.shell}>
			<header className={styles.header}>
				<div className={styles.headerInner}>
					<Link to="/" className={styles.brand} aria-label="Home">
						<Monogram />
						<span className={styles.brandText}>
							<span className={styles.brandKicker}>Dev3Pack · edition</span>
							<span className={styles.brandTitle}>
								Proof-of-Presence <em>Manual Protocol</em>
							</span>
						</span>
					</Link>

					{isLanding ? (
						<div className={styles.landingActions}>
							<Link to="/host" className={styles.launchBtn}>
								Launch app →
							</Link>
						</div>
					) : (
						<>
							<nav className={styles.nav}>
								<NavItem to="/host" current={pathname}>
									My classes
								</NavItem>
								<NavItem to="/join" current={pathname}>
									My attendance
								</NavItem>
							</nav>

							<div className={styles.headerActions}>
								<WalletDropdown />
							</div>
						</>
					)}
				</div>
				<hr className={styles.headerRule} />
			</header>

			<main className={styles.main}>
				<Outlet />
			</main>

			<footer className={styles.footer}>
				<div className={styles.footerInner}>
					<span className={styles.footerSig}>
						<span className={styles.footerSigSym}>§</span>
						Proof-of-Presence Manual Protocol · Dev3Pack edition
					</span>
				</div>
			</footer>
		</div>
	)
}

const NavItem: React.FC<{
	to: string
	current: string
	children: React.ReactNode
}> = ({ to, current, children }) => {
	const active = current === to
	return (
		<Link to={to} className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}>
			{children}
		</Link>
	)
}

const Monogram: React.FC = () => (
	<svg
		viewBox="0 0 60 60"
		className={styles.monogram}
		aria-hidden="true"
	>
		<rect x="2" y="2" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="2" />
		<rect x="6" y="6" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 3" />
		<text
			x="30"
			y="38"
			textAnchor="middle"
			fontFamily="Fraunces, serif"
			fontStyle="italic"
			fontSize="26"
			fontWeight="500"
			fill="currentColor"
		>
			ƒ
		</text>
		<circle cx="46" cy="14" r="3" fill="#b8341f" />
	</svg>
)

export default App
