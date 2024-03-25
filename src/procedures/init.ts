import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { $ } from 'bun'
import type { Procedure } from '~/procedures/types'
import type { ProcedureOptions } from '~/tezonator'
import { get_config_dir } from '~/transformers/get_config_dir'

const init_client: Procedure<ProcedureOptions> = {
	id: Symbol('init octez client'),
	run: async options => {
		const client_data_dir = get_config_dir({
			procedure_options: options,
			type: 'client',
		})

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
		const node_data_dir = get_config_dir({
			procedure_options: options,
			type: 'node',
		})

		const bin_dir = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		const network =
			options.tezos_network.network_url ??
			options.tezos_network.human_name.toLowerCase()

		await mkdir(node_data_dir, { recursive: true })

		const output = await $`${path.join(
			bin_dir,
			'octez-node',
		)} config init --network ${network} --data-dir ${node_data_dir}`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

const generate_identity: Procedure<ProcedureOptions> = {
	id: Symbol('generate identity'),
	run: async options => {
		const node_data_dir = get_config_dir({
			procedure_options: options,
			type: 'node',
		})

		const bin_dir = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		const config_file = path.join(node_data_dir, 'config.json')

		const output = await $`${path.join(
			bin_dir,
			'octez-node',
		)} identity generate --config-file ${config_file}`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
	dependencies: [init_node],
}

export const init_procedures: Procedure<ProcedureOptions>[] = [
	init_client,
	generate_identity,
]
