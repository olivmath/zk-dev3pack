import * as Client from "attendance"
import { networkPassphrase, rpcUrl } from "./util"

const contractId = import.meta.env.PUBLIC_ATTENDANCE_CONTRACT_ID as string

export default new Client.Client({
	networkPassphrase,
	contractId,
	rpcUrl,
	allowHttp: rpcUrl.startsWith("http://"),
	publicKey: undefined,
})

export { Client }
