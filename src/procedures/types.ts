import type { TezosNetwork } from '~/flow/validators/tezos_networks'
import type { UserPaths } from '~/procedures/create_user_paths'
import type { command_options } from '~/tezonator'

export type Procedure = {
	id: symbol
	run: (options: ProcedureOptions) => Promise<void>
	can_skip?: (options: ProcedureOptions) => Promise<boolean>
	dependencies?: Procedure[]
}

export type ProcedureOptions = {
	git_url: string
	repo_dir: string
	tezos_network: TezosNetwork
	user_paths: UserPaths
	command_options: typeof command_options
}

export type ProcedureResult = {
	message: string
	is_success: boolean
}
