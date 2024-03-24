import type {
	TezosNetwork,
	TezosNetworks,
} from '~/flow/validators/tezos_networks'

export function get_tezos_network({
	tezos_networks,
	prefix,
}: { tezos_networks: TezosNetworks; prefix: string }):
	| TezosNetwork
	| undefined {
	const key = Object.keys(tezos_networks).find(teztnet =>
		teztnet.startsWith(prefix),
	)
	if (!key) {
		return
	}
	const tezos_network = tezos_networks[key]
	return tezos_network
}
