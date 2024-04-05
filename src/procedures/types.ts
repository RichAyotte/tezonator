import type { DataPathType } from '~/data/data_path_types'
import type { TezosNetworkName } from '~/data/network_names'
import type { ServiceName } from '~/data/service_names'
import type { SafeGetMap } from '~/flow/safe_get_map'
import type { TezosNetwork } from '~/flow/validators/tezos_networks'
import type { UserPaths } from '~/procedures/create_user_paths'
import type { CommandOptions } from '~/tezonator'

export type Procedure = {
	id: symbol
	run: (options: ProcedureInput) => Promise<void>
	can_skip?: (options: ProcedureInput) => Promise<boolean>
	dependencies?: Procedure[]
}

export type ProcedureInput = {
	bin_path: string
	command_options: CommandOptions
	data_paths: SafeGetMap<DataPathType, string>
	git_url: string
	octez_repo_path: string
	repo_dir_name: string
	service_file_names: SafeGetMap<ServiceName, string>
	tezos_network: Pick<
		TezosNetwork,
		'git_ref' | 'human_name' | 'last_baking_daemon' | 'rpc_url' | 'network_url'
	> & { git_hash: string; name: TezosNetworkName }
	user_paths: UserPaths
}

export type ProcedureResult = {
	message: string
	is_success: boolean
}
