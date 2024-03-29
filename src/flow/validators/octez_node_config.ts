import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { FromSchema, JSONSchema } from 'json-schema-to-ts'

const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

// Schema was generated using ./_build/default/src/bin_codec/codec.exe dump encoding node-config | jq .json
// https://tezos-dev.slack.com/archives/C596FGNUR/p1711727070875239?thread_ts=1711719636.200109&cid=C596FGNUR
// https://gitlab.com/tezos/tezos/-/merge_requests/12723
// Generated from gitlab tezos repo commit b23e2811353277ebf207836440013e5fd1c6bf2d
// NOTE: $schema was replaced with 'http://json-schema.org/draft-07/schema#',
// Also added minItems: 2 to a few tuples max_known_peer_ids and max_known_points

export const octez_node_config_schema = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	additionalProperties: false,
	definitions: {
		Protocol_hash: {
			$ref: '#/definitions/unistring',
			title: 'A Tezos protocol ID (Base58Check-encoded)',
		},
		block_hash: {
			$ref: '#/definitions/unistring',
			title: 'A block identifier (Base58Check-encoded)',
		},
		'distributed_db_version.name': {
			$ref: '#/definitions/unistring',
			description: 'A name for the distributed DB protocol',
		},
		history_mode: {
			description: 'Storage mode for the Tezos shell.',
			oneOf: [
				{
					description:
						'Archive mode retains every block and operations since the genesis block including their metadata and their associated contexts.',
					enum: ['archive'],
					title: 'archive',
					type: 'string',
				},
				{
					additionalProperties: false,
					description:
						"Full mode retains every block and operations since the genesis block but periodically prunes older blocks' metadata to reduce the storage size.",
					properties: {
						full: {
							additionalProperties: false,
							properties: {
								additional_cycles: {
									description:
										'Number of additional cycles preserved below the savepoint. By default: 1 additional cycles will be stored.',
									maximum: 1000,
									minimum: 0,
									title: 'additional cycles',
									type: 'integer',
								},
							},
							required: ['additional_cycles'],
							type: 'object',
						},
					},
					required: ['full'],
					title: 'full',
					type: 'object',
				},
				{
					additionalProperties: false,
					description:
						'Rolling mode only retain the most recent cycles by periodically periodically discarding older blocks to reduce the storage size.',
					properties: {
						rolling: {
							additionalProperties: false,
							properties: {
								additional_cycles: {
									description:
										'Number of additional cycles preserved below the savepoint. By default: 1 additional cycles will be stored.',
									maximum: 1000,
									minimum: 0,
									title: 'additional cycles',
									type: 'integer',
								},
							},
							required: ['additional_cycles'],
							type: 'object',
						},
					},
					required: ['rolling'],
					title: 'rolling',
					type: 'object',
				},
				{
					description: 'Full mode with default number of additional cycles.',
					enum: ['full'],
					title: 'full_alias',
					type: 'string',
				},
				{
					description: 'Rolling mode with default number of additional cycles.',
					enum: ['rolling'],
					title: 'rolling_alias',
					type: 'string',
				},
			],
			title: 'history mode',
		},
		max_active_rpc_connections: {
			description: 'The maximum alowed number of RPC connections',
			oneOf: [
				{
					description:
						'There is not limit of the number of RPC connections allowed.',
					enum: ['unlimited'],
					title: 'unlimited',
					type: 'string',
				},
				{
					description:
						"The number of maximum RPC connections allowed is limited to the given integer's value.",
					maximum: 1073741823,
					minimum: -1073741824,
					title: 'limited',
					type: 'integer',
				},
			],
			title: 'max_active_rpc_connections',
		},
		operation_metadata_size_limit: {
			description: 'The operation metadata size limit',
			oneOf: [
				{
					description: 'The metadata size is unlimited.',
					enum: ['unlimited'],
					title: 'unlimited',
					type: 'string',
				},
				{
					description:
						"The metadata size is limited to the given integer's value (in bytes).",
					maximum: 1073741823,
					minimum: -1073741824,
					title: 'limited',
					type: 'integer',
				},
			],
			title: 'operation_metadata_size_limit',
		},
		'timespan.system': {
			description: 'A span of time, as seen by the local computer.',
			type: 'number',
		},
		'timestamp.protocol': {
			$ref: '#/definitions/unistring',
			description:
				'A timestamp as seen by the protocol: second-level precision, epoch based.',
		},
		unistring: {
			description:
				'Either a plain UTF8 string, or a sequence of bytes for strings that contain invalid byte sequences.',
			oneOf: [
				{
					type: 'string',
				},
				{
					additionalProperties: false,
					properties: {
						invalid_utf8_string: {
							items: {
								maximum: 255,
								minimum: 0,
								type: 'integer',
							},
							type: 'array',
						},
					},
					required: ['invalid_utf8_string'],
					type: 'object',
				},
			],
			title: 'Universal string representation',
		},
		'user_activated.protocol_overrides': {
			description:
				'User activated protocol overrides: activate a protocol instead of another.',
			items: {
				additionalProperties: false,
				properties: {
					replaced_protocol: {
						$ref: '#/definitions/Protocol_hash',
					},
					replacement_protocol: {
						$ref: '#/definitions/Protocol_hash',
					},
				},
				required: ['replacement_protocol', 'replaced_protocol'],
				type: 'object',
			},
			title: 'User activated protocol overrides',
			type: 'array',
		},
		'user_activated.upgrades': {
			description:
				'User activated upgrades: at given level, switch to given protocol.',
			items: {
				additionalProperties: false,
				properties: {
					level: {
						maximum: 2147483647,
						minimum: -2147483648,
						type: 'integer',
					},
					replacement_protocol: {
						$ref: '#/definitions/Protocol_hash',
					},
				},
				required: ['replacement_protocol', 'level'],
				type: 'object',
			},
			title: 'User activated upgrades',
			type: 'array',
		},
	},
	properties: {
		'data-dir': {
			$ref: '#/definitions/unistring',
			description: 'Location of the data dir on disk.',
		},
		'disable-config-validation': {
			description: 'Disable the node configuration validation.',
			type: 'boolean',
		},
		'internal-events': {
			description: 'Configuration of the structured logging framework',
			oneOf: [
				{
					additionalProperties: false,
					description: 'List of sinks to make sure are activated.',
					properties: {
						active_sinks: {
							description: 'List of URIs to activate/configure sinks.',
							items: {
								$ref: '#/definitions/unistring',
							},
							type: 'array',
						},
					},
					title: 'Active-Sinks',
					type: 'object',
				},
				{
					additionalProperties: false,
					description:
						'List of sinks to make sure are activated, deprecated backwards-compatibility encoding.',
					properties: {
						activate: {
							description: 'List of URIs to activate/configure sinks.',
							items: {
								$ref: '#/definitions/unistring',
							},
							type: 'array',
						},
					},
					title: 'Active-Sinks-Deprecated',
					type: 'object',
				},
			],
		},
		log: {
			additionalProperties: false,
			description:
				'Configuration of the Lwt-log sink (part of the logging framework)',
			properties: {
				colors: {
					description: 'Enables light coloring in logs.',
					type: 'boolean',
				},
				level: {
					description:
						"Verbosity level: one of 'fatal', 'error', 'warn','notice', 'info', 'debug'.",
					enum: ['info', 'debug', 'error', 'fatal', 'warning', 'notice'],
					type: 'string',
				},
				output: {
					$ref: '#/definitions/unistring',
					description:
						"Output for the logging function. Either 'stdout', 'stderr' or the name of a log file .",
				},
				rules: {
					$ref: '#/definitions/unistring',
					description:
						"Fine-grained logging instructions. Same format as described in `octez-node run --help`, DEBUG section. In the example below, sections 'p2p' and all sections starting by 'client' will have their messages logged up to the debug level, whereas the rest of log sections will be logged up to the notice level.",
				},
			},
			type: 'object',
		},
		metrics_addr: {
			description: 'Configuration of the Prometheus metrics endpoint',
			items: {
				$ref: '#/definitions/unistring',
			},
			type: 'array',
		},
		network: {
			description: 'Configuration of which network/blockchain to connect to',
			oneOf: [
				{
					enum: ['sandbox'],
					title: 'sandbox',
					type: 'string',
				},
				{
					enum: ['mainnet'],
					title: 'mainnet',
					type: 'string',
				},
				{
					enum: ['ghostnet'],
					title: 'ghostnet',
					type: 'string',
				},
				{
					additionalProperties: false,
					properties: {
						chain_name: {
							$ref: '#/definitions/distributed_db_version.name',
						},
						dal_config: {
							additionalProperties: false,
							description:
								'USE FOR TESTING PURPOSE ONLY. Configuration for the data-availibility layer',
							properties: {
								activated: {
									type: 'boolean',
								},
								bootstrap_peers: {
									items: {
										$ref: '#/definitions/unistring',
									},
									type: 'array',
								},
								use_mock_srs_for_testing: {
									type: 'boolean',
								},
							},
							required: [
								'bootstrap_peers',
								'use_mock_srs_for_testing',
								'activated',
							],
							type: 'object',
						},
						default_bootstrap_peers: {
							description:
								'List of hosts to use if p2p.bootstrap_peers is unspecified.',
							items: {
								$ref: '#/definitions/unistring',
							},
							type: 'array',
						},
						genesis: {
							additionalProperties: false,
							properties: {
								block: {
									$ref: '#/definitions/block_hash',
								},
								protocol: {
									$ref: '#/definitions/Protocol_hash',
								},
								timestamp: {
									$ref: '#/definitions/timestamp.protocol',
								},
							},
							required: ['protocol', 'block', 'timestamp'],
							type: 'object',
						},
						genesis_parameters: {
							additionalProperties: false,
							properties: {
								context_key: {
									$ref: '#/definitions/unistring',
								},
								values: {},
							},
							required: ['values'],
							type: 'object',
						},
						incompatible_chain_name: {
							$ref: '#/definitions/distributed_db_version.name',
						},
						old_chain_name: {
							$ref: '#/definitions/distributed_db_version.name',
						},
						sandboxed_chain_name: {
							$ref: '#/definitions/distributed_db_version.name',
						},
						user_activated_protocol_overrides: {
							$ref: '#/definitions/user_activated.protocol_overrides',
						},
						user_activated_upgrades: {
							$ref: '#/definitions/user_activated.upgrades',
						},
					},
					required: ['sandboxed_chain_name', 'chain_name', 'genesis'],
					title: 'Custom',
					type: 'object',
				},
			],
		},
		p2p: {
			additionalProperties: false,
			description: 'Configuration of network parameters',
			properties: {
				'advertised-net-port': {
					description:
						'Alternative port advertised to other peers to connect to. If the port is not specified, the port from listen-addr will be assumed.',
					maximum: 65535,
					minimum: 0,
					type: 'integer',
				},
				'bootstrap-peers': {
					description:
						'List of hosts. Tezos can connect to both IPv6 and IPv4 hosts. If the port is not specified, default port 9732 will be assumed.',
					items: {
						$ref: '#/definitions/unistring',
					},
					type: 'array',
				},
				disable_mempool: {
					description:
						'If set to [true], the node will not participate in the propagation of pending operations (mempool). Default value is [false]. It can be used to decrease the memory and computation footprints of the node.',
					type: 'boolean',
				},
				disable_peer_discovery: {
					description:
						'This field should be used for testing purpose only. If set to [true], the node will not participate to the peer discovery mechanism. The node will not be able to find new peers to connect with.',
					type: 'boolean',
				},
				'discovery-addr': {
					description:
						'Host for local peer discovery. If the port is not specified, the default port 10732 will be assumed.',
					oneOf: [
						{
							$ref: '#/definitions/unistring',
							title: 'Some',
						},
						{
							title: 'None',
							type: 'null',
						},
					],
				},
				enable_testchain: {
					description:
						"DEPRECATED. If set to [true], the node will spawn a testchain during the protocol's testing voting period. Default value is [false]. It is disabled to decrease the node storage usage and computation by dropping the validation of the test network blocks.",
					type: 'boolean',
				},
				'expected-proof-of-work': {
					description:
						'Floating point number between 0 and 256 that represents a difficulty, 24 signifies for example that at least 24 leading zeroes are expected in the hash.',
					type: 'number',
				},
				greylisting_config: {
					additionalProperties: false,
					description:
						'The reconnection policy regulates the frequency with which the node tries to reconnect to an old known peer.',
					properties: {
						'disconnection-delay': {
							$ref: '#/definitions/timespan.system',
							description:
								'The span of time a peer is disconnected for when it is disconnected as the result of an error.',
						},
						factor: {
							description:
								'The factor by which the reconnection delay is increased when a peer that was previously disconnected is disconnected again. This value should be set to 1 for a linear back-off and to >1 for an exponential back-off.',
							type: 'number',
						},
						'increase-cap': {
							$ref: '#/definitions/timespan.system',
							description:
								'The maximum amount by which the reconnection is extended. This limits the rate of the exponential back-off, which eventually becomes linear when it reaches this limit. This limit is set to avoid reaching the End-of-Time when repeatedly reconnection a peer.',
						},
						'initial-delay': {
							$ref: '#/definitions/timespan.system',
							description:
								'The span of time a peer is disconnected for when it is first disconnected.',
						},
					},
					type: 'object',
				},
				limits: {
					additionalProperties: false,
					description: 'Network limits',
					properties: {
						'authentication-timeout': {
							$ref: '#/definitions/timespan.system',
							description:
								'Delay granted to a peer to perform authentication, in seconds.',
						},
						backlog: {
							description:
								'Number above which pending incoming connections are immediately rejected.',
							maximum: 255,
							minimum: 0,
							type: 'integer',
						},
						'binary-chunks-size': {
							maximum: 255,
							minimum: 0,
							type: 'integer',
						},
						'connection-timeout': {
							$ref: '#/definitions/timespan.system',
							description:
								'Delay acceptable when initiating a connection to a new peer, in seconds.',
						},
						'expected-connections': {
							description:
								'Targeted number of connections to reach when bootstrapping / maintaining.',
							maximum: 65535,
							minimum: 0,
							type: 'integer',
						},
						'greylist-timeout': {
							$ref: '#/definitions/timespan.system',
							description: 'GC delay for the greylists tables, in seconds.',
						},
						'incoming-app-message-queue-size': {
							maximum: 1073741823,
							minimum: -1073741824,
							type: 'integer',
						},
						'incoming-message-queue-size': {
							maximum: 1073741823,
							minimum: -1073741824,
							type: 'integer',
						},
						ip_greylist_cleanup_delay: {
							$ref: '#/definitions/timespan.system',
							description: 'The time an IP address is kept in the greylist.',
						},
						ip_greylist_size_in_kilobytes: {
							description:
								'The size of the IP address greylist (in kilobytes).',
							maximum: 65535,
							minimum: 0,
							type: 'integer',
						},
						'maintenance-idle-time': {
							description:
								'How long to wait at most, in seconds, before running a maintenance loop. If null -- decoding to None -- is provided then the maintenance is disabled.',
							oneOf: [
								{
									$ref: '#/definitions/timespan.system',
									title: 'Some',
								},
								{
									title: 'None',
									type: 'null',
								},
							],
						},
						'max-connections': {
							description:
								'Maximum number of connections (exceeding peers are disconnected).',
							maximum: 65535,
							minimum: 0,
							type: 'integer',
						},
						'max-download-speed': {
							description: 'Max download speeds in KiB/s.',
							maximum: 1073741823,
							minimum: -1073741824,
							type: 'integer',
						},
						'max-incoming-connections': {
							description:
								'Number above which pending incoming connections are immediately rejected.',
							maximum: 255,
							minimum: 0,
							type: 'integer',
						},
						'max-upload-speed': {
							description: 'Max upload speeds in KiB/s.',
							maximum: 1073741823,
							minimum: -1073741824,
							type: 'integer',
						},
						max_known_peer_ids: {
							additionalItems: false,
							description: 'The max and target size for the known peers table.',
							items: [
								{
									maximum: 65535,
									minimum: 0,
									type: 'integer',
								},
								{
									maximum: 65535,
									minimum: 0,
									type: 'integer',
								},
							],
							minItems: 2,
							type: 'array',
						},
						max_known_points: {
							additionalItems: false,
							description:
								'The max and target size for the known address table.',
							items: [
								{
									maximum: 65535,
									minimum: 0,
									type: 'integer',
								},
								{
									maximum: 65535,
									minimum: 0,
									type: 'integer',
								},
							],
							minItems: 2,
							type: 'array',
						},
						'min-connections': {
							description:
								'Strict minimum number of connections (triggers an urgent maintenance).',
							maximum: 65535,
							minimum: 0,
							type: 'integer',
						},
						'outgoing-message-queue-size': {
							maximum: 1073741823,
							minimum: -1073741824,
							type: 'integer',
						},
						peer_greylist_size: {
							description:
								'The number of peer_ids kept in the peer_id greylist.',
							maximum: 65535,
							minimum: 0,
							type: 'integer',
						},
						'read-buffer-size': {
							description: 'Size of the buffer passed to read(2).',
							maximum: 1073741823,
							minimum: -1073741824,
							type: 'integer',
						},
						'read-queue-size': {
							maximum: 1073741823,
							minimum: -1073741824,
							type: 'integer',
						},
						'swap-linger': {
							oneOf: [
								{
									$ref: '#/definitions/timespan.system',
									title: 'Some',
								},
								{
									title: 'None',
									type: 'null',
								},
							],
						},
						'write-queue-size': {
							maximum: 1073741823,
							minimum: -1073741824,
							type: 'integer',
						},
					},
					type: 'object',
				},
				'listen-addr': {
					$ref: '#/definitions/unistring',
					description:
						'Host to listen to. If the port is not specified, the default port 9732 will be assumed.',
				},
				'private-mode': {
					description:
						"Specify if the node is in private mode or not. A node in private mode rejects incoming connections from untrusted peers and only opens outgoing connections to peers listed in 'bootstrap-peers' or provided with '--peer' option. Moreover, these peers will keep the identity and the address of the private node secret.",
					type: 'boolean',
				},
			},
			type: 'object',
		},
		rpc: {
			additionalProperties: false,
			description: 'Configuration of rpc parameters',
			properties: {
				acl: {
					description: 'A list of RPC ACLs for specific listening addresses.',
					items: {
						oneOf: [
							{
								additionalProperties: false,
								properties: {
									address: {
										$ref: '#/definitions/unistring',
									},
									whitelist: {
										items: {
											$ref: '#/definitions/unistring',
										},
										type: 'array',
									},
								},
								required: ['whitelist', 'address'],
								title: 'Whitelist',
								type: 'object',
							},
							{
								additionalProperties: false,
								properties: {
									address: {
										$ref: '#/definitions/unistring',
									},
									blacklist: {
										items: {
											$ref: '#/definitions/unistring',
										},
										type: 'array',
									},
								},
								required: ['blacklist', 'address'],
								title: 'Blacklist',
								type: 'object',
							},
						],
					},
					type: 'array',
				},
				'cors-headers': {
					description:
						'Cross Origin Resource Sharing parameters, see https://en.wikipedia.org/wiki/Cross-origin_resource_sharing.',
					items: {
						$ref: '#/definitions/unistring',
					},
					type: 'array',
				},
				'cors-origin': {
					description:
						'Cross Origin Resource Sharing parameters, see https://en.wikipedia.org/wiki/Cross-origin_resource_sharing.',
					items: {
						$ref: '#/definitions/unistring',
					},
					type: 'array',
				},
				crt: {
					$ref: '#/definitions/unistring',
					description: 'Certificate file (necessary when TLS is used).',
				},
				'external-listen-addrs': {
					description:
						'Hosts to listen to. If the port is not specified, the default port 8732 will be assumed.',
					items: {
						$ref: '#/definitions/unistring',
					},
					type: 'array',
				},
				key: {
					$ref: '#/definitions/unistring',
					description: 'Key file (necessary when TLS is used).',
				},
				'listen-addr': {
					$ref: '#/definitions/unistring',
					description: 'Legacy value: Host to listen to',
				},
				'listen-addrs': {
					description:
						'Hosts to listen to. If the port is not specified, the default port 8732 will be assumed.',
					items: {
						$ref: '#/definitions/unistring',
					},
					type: 'array',
				},
				max_active_rpc_connections: {
					$ref: '#/definitions/max_active_rpc_connections',
					description:
						'The maximum number of active connections per RPC endpoint.',
				},
				'media-type': {
					description: 'The media types supported by the server.',
					enum: ['json', 'any', 'binary'],
					type: 'string',
				},
			},
			type: 'object',
		},
		shell: {
			additionalProperties: false,
			description: 'Configuration of network parameters',
			properties: {
				block_validator: {
					additionalProperties: false,
					properties: {
						operation_metadata_size_limit: {
							$ref: '#/definitions/operation_metadata_size_limit',
						},
						protocol_request_timeout: {
							$ref: '#/definitions/timespan.system',
						},
					},
					type: 'object',
				},
				chain_validator: {
					oneOf: [
						{
							additionalProperties: false,
							properties: {
								latency: {
									description:
										'[latency] is the time interval (in seconds) used to determine if a peer is synchronized with a chain. For instance, a peer whose known head has a timestamp T is considered synchronized if T >= now - latency. This parameter depends on the baking rate and the latency of the network.',
									maximum: 65535,
									minimum: 0,
									type: 'integer',
								},
								synchronisation_threshold: {
									description:
										'The minimal number of peers this peer should be synchronized with in order to be bootstrapped.',
									maximum: 255,
									minimum: 0,
									type: 'integer',
								},
							},
							title: 'synchronisation_heuristic_encoding',
							type: 'object',
						},
						{
							additionalProperties: false,
							properties: {
								bootstrap_threshold: {
									description:
										'[DEPRECATED] Set the number of peers with whom a chain synchronisation must be completed to bootstrap the node.',
									maximum: 255,
									minimum: 0,
									type: 'integer',
								},
							},
							title: 'legacy_bootstrap_threshold_encoding',
							type: 'object',
						},
					],
				},
				history_mode: {
					$ref: '#/definitions/history_mode',
				},
				peer_validator: {
					additionalProperties: false,
					properties: {
						block_header_request_timeout: {
							$ref: '#/definitions/timespan.system',
						},
						block_operations_request_timeout: {
							$ref: '#/definitions/timespan.system',
						},
						new_head_request_timeout: {
							$ref: '#/definitions/timespan.system',
						},
						protocol_request_timeout: {
							$ref: '#/definitions/timespan.system',
						},
					},
					type: 'object',
				},
				prevalidator: {
					additionalProperties: false,
					properties: {
						max_refused_operations: {
							maximum: 65535,
							minimum: 0,
							type: 'integer',
						},
						operations_batch_size: {
							maximum: 1073741823,
							minimum: -1073741824,
							type: 'integer',
						},
						operations_request_timeout: {
							$ref: '#/definitions/timespan.system',
						},
					},
					type: 'object',
				},
			},
			type: 'object',
		},
	},
	type: 'object',
} as const satisfies JSONSchema

export type OctezNodeConfig = FromSchema<typeof octez_node_config_schema>
export const validate_octez_node_config = ajv.compile<OctezNodeConfig>(
	octez_node_config_schema,
)
