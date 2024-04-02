import path from 'node:path'
import type { ProcedureOptions } from '~/procedures/types'

type GetConfigDirInput = {
	procedure_options: ProcedureOptions
	type: 'client' | 'node' | 'dal'
}

export function get_config_dir({
	procedure_options,
	type,
}: GetConfigDirInput): string {
	return path.join(
		procedure_options.user_paths.data,
		'config',
		procedure_options.tezos_network.human_name.toLowerCase(),
		type,
	)
}
