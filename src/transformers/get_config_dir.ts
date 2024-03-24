import path from 'node:path'
import type { ProcedureOptions } from '~/tezonator'

type GetConfigDirInput = {
	procedure_options: ProcedureOptions
	type: 'client' | 'node'
}

export function get_config_dir({
	procedure_options,
	type,
}: GetConfigDirInput): string {
	return path.join(
		procedure_options.user_paths.data,
		'networks',
		procedure_options.tezos_network.human_name.toLowerCase(),
		type,
	)
}
