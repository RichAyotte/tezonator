import type { ServiceName } from '~/data/service_names'
import type { TezosNetwork } from '~/flow/validators/tezos_networks'
import { get_tezos_network_name } from '~/transformers/get_tezos_network_name'

type GetServiceFileNameInput = {
	tezos_network: TezosNetwork
	service_name: ServiceName
}

export function get_service_file_name({
	service_name,
	tezos_network,
}: GetServiceFileNameInput): string {
	const tezos_network_name = get_tezos_network_name({ tezos_network })
	return `octez-${service_name}-${tezos_network_name}.service`
}
