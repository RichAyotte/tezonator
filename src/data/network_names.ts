export const network_names = [
	'ghostnet',
	'mainnet',
	'oxfordnet',
	'parisanet',
	'parisbnet',
	'predalnet',
	'weeklynet',
] as const

export type TezosNetworkName = (typeof network_names)[number]
export const tezos_network_names = new Set<TezosNetworkName>(network_names)
