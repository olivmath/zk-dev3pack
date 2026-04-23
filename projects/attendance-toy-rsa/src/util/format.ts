export const truncateAddress = (addr: string): string =>
	`${addr.slice(0, 8)}…${addr.slice(-6)}`

export const padClassId = (id: string | bigint | number): string =>
	id.toString().padStart(2, "0")
