import { useContext } from "react"
import { WalletContext } from "../providers/WalletProvider"
import attendance from "../contracts/attendance"

/**
 * Wraps the attendance contract client with the current connected wallet.
 * Mutations go through `.signAndSend({ signTransaction })`.
 * Reads go through `.result` after awaiting the simulation.
 */
export function useAttendance() {
	const { address, signTransaction } = useContext(WalletContext)

	if (address) {
		attendance.options.publicKey = address
	}

	const signAndSend = async <T,>(tx: {
		signAndSend: (opts: { signTransaction: typeof signTransaction }) => Promise<{ result: T }>
	}): Promise<T> => {
		const { result } = await tx.signAndSend({ signTransaction })
		return result
	}

	return { attendance, address, signAndSend }
}
