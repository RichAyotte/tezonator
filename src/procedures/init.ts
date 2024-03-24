import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { $ } from 'bun'
import type { Procedure } from '~/procedures/types'
import type { ProcedureOptions } from '~/tezonator'

const init_client: Procedure<ProcedureOptions> = {
	id: Symbol('init octez client'),
	run: async options => {
		const client_data_dir = path.join(options.user_paths.data, 'client')
		const bin_dir = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		await mkdir(client_data_dir, { recursive: true })

		const output = await $`${path.join(
			bin_dir,
			'octez-client',
		)} --base-dir ${client_data_dir} --endpoint ${
			options.tezos_network.rpc_url
		} config init`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

const init_node: Procedure<ProcedureOptions> = {
	id: Symbol('init octez node'),
	run: async options => {
		const node_data_dir = path.join(options.user_paths.data, 'node')
		const bin_dir = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		await mkdir(node_data_dir, { recursive: true })

		const output = await $`${path.join(
			bin_dir,
			'octez-node',
		)} config init --network ${
			options.tezos_network.network_url
		} --data-dir ${node_data_dir}`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

export const init_procedures: Procedure<ProcedureOptions>[] = [
	init_client,
	init_node,
]
