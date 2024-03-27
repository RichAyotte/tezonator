import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { $ } from 'bun'
import type { Procedure } from '~/procedures/types'
import type { ProcedureOptions } from '~/tezonator'
import { get_config_dir } from '~/transformers/get_config_dir'

const init_client: Procedure<ProcedureOptions> = {
	async can_skip(options) {
		if (options.command_options.force === true) {
			return false
		}

		const bin_dir = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		const client_data_dir = get_config_dir({
			procedure_options: options,
			type: 'client',
		})

		const output = await $`${path.join(
			bin_dir,
			'octez-client',
		)} --base-dir ${client_data_dir} --endpoint ${
			options.tezos_network.rpc_url
		} config show`.quiet()

		return output.exitCode === 0
	},
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
	async can_skip(options) {
		if (options.command_options.force === true) {
			return false
		}

		const node_data_dir = get_config_dir({
			procedure_options: options,
			type: 'node',
		})

		const bin_dir = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		const output = await $`${path.join(
			bin_dir,
			'octez-node',
		)} config show --data-dir ${node_data_dir}`.quiet()

		return output.exitCode === 0
	},
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

		const config_show_output = await $`${path.join(
			bin_dir,
			'octez-node',
		)} config show --data-dir ${node_data_dir}`.quiet()

		if (config_show_output.exitCode !== 0) {
			// config is invalid. Move it to a backup.
			await $`mv config.json config-${Date.now()}.json`
				.cwd(node_data_dir)
				.quiet()
		}

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
	async can_skip(options) {
		if (options.command_options.force === true) {
			return false
		}

		const node_data_dir = get_config_dir({
			procedure_options: options,
			type: 'node',
		})

		return fs.existsSync(path.join(node_data_dir, 'identity.json'))
	},
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

		await mkdir(node_data_dir, { recursive: true })

		const output = await $`${path.join(
			bin_dir,
			'octez-node',
		)} identity generate --config-file ${config_file}`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

export const init_procedures: Procedure<ProcedureOptions>[] = [
	init_client,
	init_node,
	generate_identity,
]
