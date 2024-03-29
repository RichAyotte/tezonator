import {
	type TezosNetworkName,
	tezos_network_names,
} from '~/data/network_names'
import type { OctezBinary } from '~/data/octez_binaries'

type OctezConfig = Map<OctezBinary, Record<string, unknown>>

// Set some properperties not set with init
export const network_octez_binary_configs = new Map<
	TezosNetworkName,
	OctezConfig
>()

let node_metrics_port = 7731
let node_rpc_port = node_metrics_port + 100
let node_p2p_port = node_rpc_port + 100
let dal_metrics_port = node_metrics_port + 4000
let dal_rpc_port = dal_metrics_port + 100
let dal_p2p_port = dal_rpc_port + 100

for (const network_name of tezos_network_names) {
	node_metrics_port += 1
	node_rpc_port += 1
	node_p2p_port += 1
	dal_metrics_port += 1
	dal_rpc_port += 1
	dal_p2p_port += 1

	if (!network_octez_binary_configs.has(network_name)) {
		network_octez_binary_configs.set(network_name, new Map())
	}
	const configs = network_octez_binary_configs.get(network_name)
	if (configs) {
		configs.set('octez-node', {
			metrics_addr: [`0.0.0.0:${node_metrics_port}`],
			p2p: { 'listen-addr': `0.0.0.0:${node_p2p_port}` },
			rpc: { 'listen-addr': `127.0.0.1:${node_rpc_port}` },
		})

		configs.set('octez-dal-node', {
			endpoint: `http://127.0.0.1:${node_rpc_port}`,
			'public-addr': `0.0.0.0:${dal_p2p_port}`,
			'net-addr': `0.0.0.0:${dal_p2p_port}`,
			'rpc-addr': `127.0.0.1:${dal_rpc_port}`,
			'metrics-addr': `0.0.0.0:${dal_metrics_port}`,
		})
	}
}
