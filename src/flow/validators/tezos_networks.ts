import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FromSchema, JSONSchema } from 'json-schema-to-ts'

const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

export const tezos_network_schema = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	type: 'object',
	properties: {
		category: { type: 'string' },
		chain_name: { type: 'string' },
		dal_nodes: {
			type: 'object',
			patternProperties: {
				'^dal(-[a-zA-Z0-9]+)+$': {
					type: 'object',
					properties: {
						humanName: { type: 'string' },
						p2p: { type: 'string' },
						rpc: { type: 'string' },
					},
					required: ['humanName', 'p2p', 'rpc'],
				},
			},
			additionalProperties: false,
		},
		description: { type: 'string' },
		docker_build: { type: 'string' },
		evm_proxy_urls: {
			type: 'array',
			items: { type: 'string' },
		},
		faucet_url: { type: 'string' },
		git_ref: { type: 'string' },
		human_name: { type: 'string' },
		indexers: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					url: { type: 'string' },
				},
				required: ['name', 'url'],
			},
		},
		last_baking_daemon: { type: 'string' },
		masked_from_main_page: { type: 'boolean' },
		network_url: { type: 'string' },
		rollup_urls: {
			type: 'array',
			items: { type: 'string' },
		},
		rpc_url: { type: 'string' },
		rpc_urls: {
			type: 'array',
			items: { type: 'string' },
		},
		activated_on: { type: 'string', format: 'date' },
	},
	required: [
		'category',
		'chain_name',
		'description',
		'docker_build',
		'git_ref',
		'human_name',
		'last_baking_daemon',
		'masked_from_main_page',
		'rpc_url',
	],
	additionalProperties: false,
} as const satisfies JSONSchema

export const tezos_networks_schema = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	type: 'object',
	patternProperties: {
		'^(dailynet|weeklynet)-\\d{4}-\\d{2}-\\d{2}$|^ghostnet$|^mainnet$|^oxfordnet$|^predalnet$':
			tezos_network_schema,
	},
	additionalProperties: false,
} as const satisfies JSONSchema

export type TezosNetworks = FromSchema<typeof tezos_networks_schema>
export type TezosNetwork = FromSchema<typeof tezos_network_schema>
export const validate_tezos_networks = ajv.compile<TezosNetworks>(
	tezos_networks_schema,
)
export const validate_tezos_network =
	ajv.compile<TezosNetwork>(tezos_network_schema)
