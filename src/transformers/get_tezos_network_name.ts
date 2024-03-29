import { type TezosNetworkName, network_names } from '~/data/network_names'
import type { TezosNetwork } from '~/flow/validators/tezos_networks'

type GetTezosNetworkNameInput = { tezos_network: TezosNetwork }

export function get_tezos_network_name({
	tezos_network,
}: GetTezosNetworkNameInput): TezosNetworkName {
	const network_name = tezos_network.human_name.toLowerCase()
	if (network_names.includes(network_name as TezosNetworkName)) {
		return network_name as TezosNetworkName
	}
	throw new Error(`Invalid network name: ${network_name}`)
}
