export const network_names = [
	'dailynet',
	'ghostnet',
	'mainnet',
	'oxfordnet',
	'parisnet',
	'weeklynet',
	'predalnet',
] as const

export type TezosNetworkName = (typeof network_names)[number]
export const tezos_network_names = new Set<TezosNetworkName>(network_names)
