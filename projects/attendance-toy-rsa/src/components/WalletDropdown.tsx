import React, { useEffect, useRef, useState, useTransition } from "react"
import { useWallet } from "../hooks/useWallet"
import { useNotification } from "../hooks/useNotification"
import { connectWallet, disconnectWallet } from "../util/wallet"
import { stellarNetwork } from "../contracts/util"
import { getFriendbotUrl } from "../util/friendbot"
import styles from "./WalletDropdown.module.css"

const formatNetwork = (n: string) =>
	n === "STANDALONE"
		? "Local"
		: n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()

const appNetwork = formatNetwork(stellarNetwork)

const truncate = (addr: string) => `${addr.slice(0, 5)}…${addr.slice(-4)}`

const WalletDropdown: React.FC = () => {
	const { address, isPending, balances, network } = useWallet()
	const { addNotification } = useNotification()
	const [open, setOpen] = useState(false)
	const [funding, startFund] = useTransition()
	const wrapRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!open) return
		const onClick = (e: MouseEvent) => {
			if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
		}
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false)
		}
		window.addEventListener("mousedown", onClick)
		window.addEventListener("keydown", onEsc)
		return () => {
			window.removeEventListener("mousedown", onClick)
			window.removeEventListener("keydown", onEsc)
		}
	}, [open])

	if (!address) {
		return (
			<button
				type="button"
				className={styles.connectBtn}
				onClick={() => void connectWallet()}
				disabled={isPending}
			>
				{isPending ? "Connecting…" : "Connect wallet"}
			</button>
		)
	}

	const walletNet = formatNetwork(network ?? "")
	const mismatch = walletNet && walletNet !== appNetwork
	const isTestnet = appNetwork.toLowerCase() === "testnet"

	const handleFund = () => {
		setOpen(false)
		startFund(async () => {
			try {
				const r = await fetch(getFriendbotUrl(address))
				if (r.ok) {
					addNotification("Account funded successfully.", "success")
				} else {
					addNotification("Funding failed — account is likely already funded.", "error")
				}
			} catch {
				addNotification("Could not reach Friendbot. Try again.", "error")
			}
		})
	}

	const handleDisconnect = () => {
		setOpen(false)
		void disconnectWallet()
	}

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(address)
			addNotification("Address copied.", "success")
		} catch {
			/* noop */
		}
	}

	return (
		<div className={styles.wrap} ref={wrapRef}>
			<button
				type="button"
				className={`${styles.trigger} ${mismatch ? styles.triggerWarn : ""}`}
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="menu"
			>
				<Identicon seed={address} />
				<span className={styles.triggerAddr}>{truncate(address)}</span>
				<span className={styles.triggerCaret} aria-hidden="true">
					{open ? "▴" : "▾"}
				</span>
			</button>

			{open && (
				<div className={styles.menu} role="menu">
					<div className={styles.menuTop}>
						<span className={styles.menuKicker}>Wallet</span>
						<button
							type="button"
							className={styles.addrLine}
							onClick={() => void handleCopy()}
							title="Click to copy"
						>
							<code>{address}</code>
						</button>
					</div>

					<hr className={styles.menuRule} />

					<div className={styles.menuRow}>
						<span className={styles.rowLabel}>Network</span>
						<span
							className={`${styles.netBadge} ${
								mismatch ? styles.netBadgeWarn : ""
							}`}
						>
							<span className={styles.netDot} />
							{appNetwork}
						</span>
					</div>

					{mismatch && (
						<p className={styles.warnLine}>
							Your wallet is on <strong>{walletNet}</strong>. Switch to{" "}
							<strong>{appNetwork}</strong> to interact with the contract.
						</p>
					)}

					<div className={styles.menuRow}>
						<span className={styles.rowLabel}>Balance</span>
						<span className={styles.balance}>
							<span className={styles.balanceNum}>
								{balances?.xlm?.balance ?? "—"}
							</span>
							<span className={styles.balanceUnit}>XLM</span>
						</span>
					</div>

					<hr className={styles.menuRule} />

					<div className={styles.menuActions}>
						{isTestnet && (
							<button
								type="button"
								className={styles.menuBtn}
								onClick={handleFund}
								disabled={funding}
							>
								{funding ? "Funding…" : "Fund via Friendbot"}
							</button>
						)}
						<button
							type="button"
							className={`${styles.menuBtn} ${styles.menuBtnDanger}`}
							onClick={handleDisconnect}
						>
							Disconnect
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

// ─────────── small SVG identicon (no extra deps) ───────────

const Identicon: React.FC<{ seed: string; size?: number }> = ({
	seed,
	size = 22,
}) => {
	// Tiny deterministic identicon: 5×5 mirrored grid coloured from the seed.
	let h = 0
	for (let i = 0; i < seed.length; i++) {
		h = (h * 31 + seed.charCodeAt(i)) >>> 0
	}
	const hue = h % 360
	const grid: boolean[] = []
	for (let i = 0; i < 15; i++) {
		grid.push(((h >> i) & 1) === 1)
	}
	const cell = size / 5
	const fill = `hsl(${hue}, 55%, 35%)`
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			className={styles.identicon}
			aria-hidden="true"
		>
			<rect width={size} height={size} fill="rgba(243,236,220,0.4)" />
			{grid.map((on, idx) => {
				if (!on) return null
				const col = Math.floor(idx / 5)
				const row = idx % 5
				return (
					<g key={idx}>
						<rect x={col * cell} y={row * cell} width={cell} height={cell} fill={fill} />
						{col < 2 && (
							<rect
								x={(4 - col) * cell}
								y={row * cell}
								width={cell}
								height={cell}
								fill={fill}
							/>
						)}
					</g>
				)
			})}
		</svg>
	)
}

export default WalletDropdown
