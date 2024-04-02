import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { $, file, write } from 'bun'
import { network_octez_binary_configs } from '~/data/network_octez_binary_config'
import type { OctezBinary } from '~/data/octez_binaries'
import { validate_octez_node_config } from '~/flow/validators/octez_node_config'
import type { Procedure } from '~/procedures/types'
import { get_config_dir } from '~/transformers/get_config_dir'
import { get_tezos_network_name } from '~/transformers/get_tezos_network_name'

const init_client: Procedure = {
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

const init_node: Procedure = {
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

		const config_file_path = path.join(node_data_dir, 'config.json')
		if (!fs.existsSync(config_file_path)) {
			return false
		}

		const config_string = file(config_file_path)
		const config = await config_string.json()

		return validate_octez_node_config(config)
	},
	id: Symbol('init octez node'),
	run: async options => {
		const bin: OctezBinary = 'octez-node'
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

		const config_file_path = path.join(node_data_dir, 'config.json')
		const config_file = file(config_file_path)
		const config = await config_file.json()

		if (!validate_octez_node_config(config)) {
			throw new Error('Octez node config file is invalid')
		}

		const tezos_network_name = get_tezos_network_name({
			tezos_network: options.tezos_network,
		})

		const network_configs = network_octez_binary_configs.get(tezos_network_name)
		if (!network_configs) {
			await write(config_file, JSON.stringify(config, null, '\t'))
			return
		}

		const octez_node_config_override = network_configs.get(bin)
		if (!octez_node_config_override) {
			await write(config_file, JSON.stringify(config, null, '\t'))
			return
		}

		await write(
			config_file,
			JSON.stringify({ ...config, ...octez_node_config_override }, null, '\t'),
		)
	},
}

const init_dal: Procedure = {
	async can_skip(options) {
		if (options.command_options.force === true) {
			return false
		}

		const dal_data_dir = get_config_dir({
			procedure_options: options,
			type: 'dal',
		})

		return fs.existsSync(path.join(dal_data_dir, 'config.json'))
	},
	id: Symbol('init octez dal'),
	run: async options => {
		const bin: OctezBinary = 'octez-dal-node'
		const dal_data_dir = get_config_dir({
			procedure_options: options,
			type: 'dal',
		})

		const bin_dir = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		await mkdir(dal_data_dir, { recursive: true })

		if (fs.existsSync(path.join(dal_data_dir, 'config.json'))) {
			await $`mv config.json config-${Date.now()}.json`
				.cwd(dal_data_dir)
				.quiet()
		}

		const output = await $`${path.join(
			bin_dir,
			'octez-dal-node',
		)} config init --data-dir ${dal_data_dir}`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}

		const config_file_path = path.join(dal_data_dir, 'config.json')
		const config_file = file(config_file_path)
		const config = await config_file.json()

		const tezos_network_name = get_tezos_network_name({
			tezos_network: options.tezos_network,
		})

		const network_configs = network_octez_binary_configs.get(tezos_network_name)
		if (!network_configs) {
			await write(config_file, JSON.stringify(config, null, '\t'))
			return
		}

		const octez_dal_config_override = network_configs.get(bin)
		if (!octez_dal_config_override) {
			await write(config_file, JSON.stringify(config, null, '\t'))
			return
		}

		await write(
			config_file,
			JSON.stringify({ ...config, ...octez_dal_config_override }, null, '\t'),
		)
	},
}

const generate_identity: Procedure = {
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

export const init_procedures: Procedure[] = [
	init_client,
	init_node,
	init_dal,
	generate_identity,
]
