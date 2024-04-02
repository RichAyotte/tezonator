import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import ini from '@richayotte/ini'
import { $, write } from 'bun'
import { get_binary_version_stdouts } from '~/data/get_binary_version_stdouts'
import { get_files } from '~/data/get_files'
import type { ServiceName } from '~/data/systemd/get_service_file'
import { get_service_file } from '~/data/systemd/get_service_file'
import { validate_systemd_service } from '~/flow/validators/systemd_service'
import type { Procedure } from '~/procedures/types'
import { get_binary_version } from '~/transformers/get_binary_version'
import { get_config_dir } from '~/transformers/get_config_dir'
import { get_filtered_obj } from '~/transformers/get_filtered_object'
import { get_service_file_name } from '~/transformers/get_service_file_name'
import { get_sexp_object } from '~/transformers/get_sexp_object'
import { get_tezos_network_name } from '~/transformers/get_tezos_network_name'

const clone_repo: Procedure = {
	async can_skip(options) {
		const repo_path = path.join(options.user_paths.data, options.repo_dir)

		if (fs.existsSync(repo_path)) {
			return true
		}

		const output = await $`git status -s`.cwd(repo_path).quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}

		return output.stdout.toString() === ''
	},
	id: Symbol('clone repo'),
	run: async options => {
		const output = await $`git clone ${options.git_url} ${options.repo_dir}`
			.cwd(options.user_paths.data)
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

const reset_repo: Procedure = {
	id: Symbol('reset repo'),
	run: async options => {
		const output = await $`git reset --hard`
			.cwd(`${path.join(options.user_paths.data, options.repo_dir)}`)
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

const git_checkout_master: Procedure = {
	id: Symbol('git checkout master'),
	run: async options => {
		const output = await $`git checkout master -q`
			.cwd(`${path.join(options.user_paths.data, options.repo_dir)}`)
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
	dependencies: [clone_repo, reset_repo],
}

const git_pull: Procedure = {
	id: Symbol('git pull'),
	run: async options => {
		const output = await $`git pull -q`
			.cwd(`${path.join(options.user_paths.data, options.repo_dir)}`)
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
	dependencies: [git_checkout_master],
}

const git_checkout_network_commit: Procedure = {
	id: Symbol('checkout network commit or branch'),
	run: async options => {
		const output = await $`git checkout ${options.tezos_network.git_ref}`
			.cwd(`${path.join(options.user_paths.data, options.repo_dir)}`)
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
	dependencies: [git_pull],
}

const patch_repo: Procedure = {
	id: Symbol('patch repo'),
	run: async options => {
		const patches_dir = path.join(
			options.user_paths.data,
			'patches',
			options.tezos_network.git_ref,
		)

		if (!fs.existsSync(patches_dir)) {
			return
		}

		const repo_path = path.join(options.user_paths.data, options.repo_dir)
		const patches = await get_files({
			dir: patches_dir,
			suffix: 'patch',
		})

		for (const patch of patches) {
			const apply_result = await $`git apply ${patch}`.cwd(repo_path).quiet()
			if (apply_result.exitCode !== 0) {
				throw new Error(apply_result.stderr.toString())
			}
		}
	},
	dependencies: [git_checkout_network_commit, reset_repo],
}

const make_build_deps: Procedure = {
	id: Symbol('make build-deps'),
	run: async options => {
		const output = await $`make build-deps`
			.cwd(`${path.join(options.user_paths.data, options.repo_dir)}`)
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
	dependencies: [patch_repo],
}

const make_binaries: Procedure = {
	async can_skip(options) {
		const repo_path = path.join(options.user_paths.data, options.repo_dir)
		const built_octez_binaries = await get_files({
			dir: repo_path,
			prefix: 'octez-',
		})

		if (built_octez_binaries.size < 15) {
			return false
		}

		const bin_version_stdouts = await get_binary_version_stdouts({
			built_octez_binaries,
		})

		const bin_versions = bin_version_stdouts.map(get_binary_version)

		return bin_versions.every(
			({ version, commit_hash }) =>
				(version && options.tezos_network.git_ref.endsWith(version)) ||
				options.tezos_network.git_ref === commit_hash,
		)
	},
	id: Symbol('make'),
	run: async options => {
		const repo_path = path.join(options.user_paths.data, options.repo_dir)
		const opam_env_sexp = await $`opam env --sexp`.cwd(repo_path).text()
		const opam_env = get_sexp_object(opam_env_sexp)
		const filtered_env = get_filtered_obj(process.env)

		const output = await $`make`
			.cwd(`${repo_path}`)
			.env({ ...filtered_env, ...opam_env })
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
	dependencies: [make_build_deps],
}

const install_binaries: Procedure = {
	async can_skip(options) {
		const target_path = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		if (!fs.existsSync(target_path)) {
			return false
		}

		const built_octez_binaries = await get_files({
			prefix: 'octez-',
			dir: target_path,
		})

		if (built_octez_binaries.size < 15) {
			return false
		}

		const bin_version_stdouts = await get_binary_version_stdouts({
			built_octez_binaries,
		})

		const bin_versions = bin_version_stdouts.map(get_binary_version)

		return bin_versions.every(
			({ version, commit_hash }) =>
				(version && options.tezos_network.git_ref.endsWith(version)) ||
				options.tezos_network.git_ref === commit_hash,
		)
	},
	id: Symbol('install octez binaries'),
	run: async options => {
		const repo_path = path.join(options.user_paths.data, options.repo_dir)
		const binaries = await get_files({
			dir: repo_path,
			prefix: 'octez-',
		})

		const target_path = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		await mkdir(target_path, { recursive: true })

		const move_result = await $`mv ${[...binaries].map(
			({ name }) => name,
		)} ${target_path}`
			.cwd(repo_path)
			.quiet()

		if (move_result.exitCode !== 0) {
			throw new Error(move_result.stderr.toString())
		}
	},
	dependencies: [make_binaries],
}

const create_service_files: Procedure = {
	id: Symbol('create service files'),
	run: async options => {
		const node_data_dir = get_config_dir({
			procedure_options: options,
			type: 'node',
		})
		const dal_data_dir = get_config_dir({
			procedure_options: options,
			type: 'dal',
		})
		const client_data_dir = get_config_dir({
			procedure_options: options,
			type: 'client',
		})
		const config_file_path = path.join(node_data_dir, 'config.json')

		const bin_dir = path.join(
			options.user_paths.bin,
			options.tezos_network.git_ref,
		)

		const service_names: ServiceName[] = ['node', 'baker', 'accuser', 'dal']

		const service_file_names = service_names.map(service_name => {
			return get_service_file_name({
				tezos_network: options.tezos_network,
				service_name,
			})
		})

		const [
			octez_node_service_filename,
			octez_baker_service_filename,
			octez_accuser_service_filename,
			octez_dal_service_filename,
		] = service_file_names

		const [node_service, baker_service, accuser_service, dal_service] =
			await Promise.all(
				service_names.map(async service_name => {
					const service = ini.parse(await get_service_file({ service_name }))
					if (validate_systemd_service(service)) {
						return service
					}
					console.error(validate_systemd_service.errors)
				}),
			)

		if (!(node_service && baker_service && accuser_service && dal_service)) {
			throw new Error('invalid service files')
		}

		node_service.Unit.Description = `Octez Node - ${options.tezos_network.human_name}`
		node_service.Service.ExecStart = [
			path.join(bin_dir, 'octez-node'),
			'run',
			['--data-dir', node_data_dir].join(' '),
		]
			.join(' ')
			.trim()
		node_service.Install.RequiredBy = [
			octez_baker_service_filename,
			octez_accuser_service_filename,
			octez_dal_service_filename,
		].join(' ')

		dal_service.Unit.Description = `Octez DAL - ${options.tezos_network.human_name}`
		dal_service.Service.ExecStart = [
			path.join(bin_dir, 'octez-dal-node'),
			'run',
			['--data-dir', dal_data_dir].join(' '),
		]
			.join(' ')
			.trim()
		dal_service.Unit.After = octez_node_service_filename
		dal_service.Unit.BindsTo = octez_node_service_filename
		dal_service.Install.WantedBy = octez_node_service_filename

		baker_service.Unit.Description = `Octez Baker - ${options.tezos_network.human_name}`
		baker_service.Service.ExecStart = [
			path.join(
				bin_dir,
				`octez-baker-${options.tezos_network.last_baking_daemon}`,
			),
			'run',
			['--base-dir', client_data_dir].join(' '),
		]
			.join(' ')
			.trim()
		baker_service.Unit.After = [
			octez_node_service_filename,
			octez_dal_service_filename,
		].join(' ')
		baker_service.Unit.BindsTo = [
			octez_node_service_filename,
			octez_dal_service_filename,
		].join(' ')
		baker_service.Install.WantedBy = [
			octez_node_service_filename,
			octez_dal_service_filename,
		].join(' ')

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

		// const service_file
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
			write(
				path.join(options.user_paths.systemd, octez_dal_service_filename),
				ini.stringify(dal_service, {}),
			),
		])

		await Promise.all(
			service_file_names.map(service_file_name =>
				$`systemctl --user enable ${service_file_name}`.quiet(),
			),
		)

		await $`systemctl --user daemon-reload`.quiet()
	},
	dependencies: [install_binaries],
}

export const build_procedures: Procedure[] = [create_service_files]
