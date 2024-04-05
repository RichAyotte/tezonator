import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { $, file, write } from 'bun'
import { network_octez_binary_configs } from '~/data/network_octez_binary_config'
import type { OctezBinary } from '~/data/octez_binaries'
import { validate_octez_node_config } from '~/flow/validators/octez_node_config'
import type { Procedure } from '~/procedures/types'

const init_client: Procedure = {
	async can_skip(input) {
		if (input.command_options.force === true) {
			return false
		}

		const client_data_path = input.data_paths.get('client')

		if (!fs.existsSync(client_data_path)) {
			return false
		}

		const output = await $`${path.join(
			input.bin_path,
			'octez-client',
		)} --base-dir ${client_data_path} --endpoint ${
			input.tezos_network.rpc_url
		} config show`.quiet()

		return output.exitCode === 0
	},
	id: Symbol('init octez client'),
	run: async input => {
		const client_data_path = input.data_paths.get('client')
		await mkdir(client_data_path, { recursive: true })

		const output = await $`${path.join(
			input.bin_path,
			'octez-client',
		)} --base-dir ${client_data_path} --endpoint ${
			input.tezos_network.rpc_url
		} config init`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

const init_node: Procedure = {
	async can_skip(input) {
		if (input.command_options.force === true) {
			return false
		}
		const node_data_path = input.data_paths.get('node')

		const config_file_path = path.join(node_data_path, 'config.json')
		if (!fs.existsSync(config_file_path)) {
			return false
		}

		const config_string = file(config_file_path)
		const config = await config_string.json()

		return validate_octez_node_config(config)
	},
	id: Symbol('init octez node'),
	run: async input => {
		const bin: OctezBinary = 'octez-node'

		const network =
			input.tezos_network.network_url ??
			input.tezos_network.human_name.toLowerCase()

		const node_data_path = input.data_paths.get('node')
		await mkdir(node_data_path, { recursive: true })

		const config_show_output = await $`${path.join(
			input.bin_path,
			'octez-node',
		)} config show --data-dir ${node_data_path}`.quiet()

		if (config_show_output.exitCode !== 0) {
			// config is invalid. Move it to a backup.
			await $`mv config.json config-${Date.now()}.json`
				.cwd(node_data_path)
				.quiet()
		}

		const output = await $`${path.join(
			input.bin_path,
			'octez-node',
		)} config init --network ${network} --data-dir ${node_data_path}`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}

		const config_file_path = path.join(node_data_path, 'config.json')
		const config_file = file(config_file_path)
		const config = await config_file.json()

		if (!validate_octez_node_config(config)) {
			throw new Error('Octez node config file is invalid')
		}

		const network_configs = network_octez_binary_configs.get(
			input.tezos_network.name,
		)
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
	async can_skip(input) {
		if (input.command_options.force === true) {
			return false
		}
		const dal_data_path = input.data_paths.get('dal')
		return fs.existsSync(path.join(dal_data_path, 'config.json'))
	},
	id: Symbol('init octez dal'),
	run: async input => {
		const bin: OctezBinary = 'octez-dal-node'
		const dal_data_path = input.data_paths.get('dal')

		await mkdir(dal_data_path, { recursive: true })

		if (fs.existsSync(path.join(dal_data_path, 'config.json'))) {
			await $`mv config.json config-${Date.now()}.json`
				.cwd(dal_data_path)
				.quiet()
		}

		const output = await $`${path.join(
			input.bin_path,
			'octez-dal-node',
		)} config init --data-dir ${dal_data_path}`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}

		const config_file_path = path.join(dal_data_path, 'config.json')
		const config_file = file(config_file_path)
		const config = await config_file.json()

		const network_configs = network_octez_binary_configs.get(
			input.tezos_network.name,
		)
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
	async can_skip(input) {
		if (input.command_options.force === true) {
			return false
		}
		const node_data_path = input.data_paths.get('node')
		return fs.existsSync(path.join(node_data_path, 'identity.json'))
	},
	id: Symbol('generate identity'),
	run: async input => {
		const node_data_path = input.data_paths.get('node')
		const config_file = path.join(node_data_path, 'config.json')

		await mkdir(node_data_path, { recursive: true })

		const output = await $`${path.join(
			input.bin_path,
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
