import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import ini from '@richayotte/ini'
import { $, write } from 'bun'
import { get_service_file } from '~/data/systemd/get_service_file'
import type { ServiceName } from '~/data/systemd/get_service_file'
import { validate_systemd_service } from '~/flow/validators/systemd_service'
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

const create_service_files: Procedure<ProcedureOptions> = {
	id: Symbol('create service files'),
	run: async options => {
		const node_data_dir = get_config_dir({
			procedure_options: options,
			type: 'node',
		})
		const config_file_path = path.join(node_data_dir, 'config.json')

		const bin_dir = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		const service_names: ServiceName[] = ['node', 'baker', 'accuser']

		const [
			octez_node_service_filename,
			octez_baker_service_filename,
			octez_accuser_service_filename,
		] = service_names.map(
			service_name =>
				`octez-${service_name}-${options.tezos_network.human_name.toLowerCase()}.service`,
		)

		const [node_service, baker_service, accuser_service] = await Promise.all(
			service_names.map(async service_name => {
				const service = ini.parse(await get_service_file({ service_name }))
				if (validate_systemd_service(service)) {
					return service
				}
				console.error(validate_systemd_service.errors)
			}),
		)

		if (!(node_service && baker_service && accuser_service)) {
			throw new Error('invalid service files')
		}

		node_service.Unit.Description = `Octez Node - ${options.tezos_network.human_name}`
		node_service.Service.ExecStart = [
			path.join(bin_dir, 'octez-node'),
			'run',
			['--config-file', config_file_path].join('='),
		]
			.join(' ')
			.trim()
		node_service.Install.RequiredBy = [
			octez_baker_service_filename,
			octez_accuser_service_filename,
		].join(' ')

		baker_service.Unit.Description = `Octez Baker - ${options.tezos_network.human_name}`
		baker_service.Service.ExecStart = [
			path.join(
				bin_dir,
				`octez-baker-${options.tezos_network.last_baking_daemon}`,
			),
			'run',
			['--config-file', config_file_path].join('='),
		]
			.join(' ')
			.trim()
		baker_service.Unit.After = octez_node_service_filename
		baker_service.Unit.BindsTo = octez_node_service_filename
		baker_service.Install.WantedBy = octez_node_service_filename

		accuser_service.Unit.Description = `Octez Accuser - ${options.tezos_network.human_name}`
		accuser_service.Service.ExecStart = [
			path.join(
				bin_dir,
				`octez-accuser-${options.tezos_network.last_baking_daemon}`,
			),
			'run',
			['--config-file', config_file_path].join('='),
		]
			.join(' ')
			.trim()
		accuser_service.Unit.After = octez_node_service_filename
		accuser_service.Unit.BindsTo = octez_node_service_filename
		accuser_service.Install.WantedBy = octez_node_service_filename

		await Promise.all([
			write(
				path.join(options.user_paths.systemd, octez_node_service_filename),
				ini.stringify(node_service, {}),
			),
			write(
				path.join(options.user_paths.systemd, octez_baker_service_filename),
				ini.stringify(baker_service, {}),
			),
			write(
				path.join(options.user_paths.systemd, octez_accuser_service_filename),
				ini.stringify(accuser_service, {}),
			),
		])
	},
}

export const init_procedures: Procedure<ProcedureOptions>[] = [
	init_client,
	generate_identity,
	create_service_files,
]
