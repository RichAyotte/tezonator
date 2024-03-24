import type { TezosNetworks } from '~/flow/validators/tezos_networks'
import { validate_tezos_networks } from '~/flow/validators/tezos_networks'

const url = 'https://teztnets.com/teztnets.json'

export async function get_tezos_networks(): Promise<TezosNetworks> {
	const response = await fetch(url)
	const tezos_networks = await response.json()

	if (!validate_tezos_networks(tezos_networks)) {
		console.error(validate_tezos_networks.errors)
		throw new Error(`Data fetched from ${url} could not be validated.`)
	}

	return tezos_networks
}
