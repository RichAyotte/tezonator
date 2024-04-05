import path from 'node:path'
import { data_path_types } from '~/data/data_path_types'
import { service_names } from '~/data/service_names'
import { get_safe_map } from '~/flow/safe_get_map'
import type { TezosNetwork } from '~/flow/validators/tezos_networks'
import type { UserPaths } from '~/procedures/create_user_paths'
import type { ProcedureInput } from '~/procedures/types'
import type { CommandOptions } from '~/tezonator'
import { get_tezos_network_name } from '~/transformers/get_tezos_network_name'

type GetProcedureInputInput = {
	command_options: CommandOptions
	git_url: string
	network_commit_hash: string
	repo_dir_name: string
	tezos_network: TezosNetwork
	user_paths: UserPaths
}

export function get_procedure_input(
	input: GetProcedureInputInput,
): ProcedureInput {
	const tezos_network_name = get_tezos_network_name({
		tezos_network: input.tezos_network,
	})

	const data_paths = get_safe_map(
		data_path_types.map(type => [
			type,
			path.join(
				input.user_paths.data,
				'data',
				input.tezos_network.human_name.toLowerCase(),
				type,
			),
		]),
	)

	const service_file_names = get_safe_map(
		service_names.map(service_name => [
			service_name,
			`octez-${service_name}-${tezos_network_name}.service`,
		]),
	)

	const git_hash = input.network_commit_hash.slice(0, 8)

	return {
		bin_path: path.join(input.user_paths.bin, git_hash),
		command_options: input.command_options,
		tezos_network: {
			git_hash,
			git_ref: input.tezos_network.git_ref,
			human_name: input.tezos_network.human_name,
			last_baking_daemon: input.tezos_network.last_baking_daemon,
			name: tezos_network_name,
			network_url: input.tezos_network.network_url,
			rpc_url: input.tezos_network.rpc_url,
		},
		git_url: input.git_url,
		octez_repo_path: path.join(input.user_paths.data, input.repo_dir_name),
		repo_dir_name: input.repo_dir_name,
		user_paths: input.user_paths,
		data_paths,
		service_file_names,
	}
}
