import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import ini from '@richayotte/ini'
import { $, write } from 'bun'
import { get_binary_version_stdouts } from '~/data/get_binary_version_stdouts'
import { get_files } from '~/data/get_files'
import { service_names } from '~/data/service_names'
import { get_service_file } from '~/data/systemd/get_service_file'
import { validate_systemd_service } from '~/flow/validators/systemd_service'
import type { Procedure } from '~/procedures/types'
import { get_binary_version } from '~/transformers/get_binary_version'
import { get_filtered_obj } from '~/transformers/get_filtered_object'
import { get_sexp_object } from '~/transformers/get_sexp_object'

const clone_repo: Procedure = {
	async can_skip(input) {
		if (fs.existsSync(input.octez_repo_path)) {
			return true
		}

		const output = await $`git status -s`.cwd(input.octez_repo_path).quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}

		return output.stdout.toString() === ''
	},
	id: Symbol('clone repo'),
	run: async input => {
		const output = await $`git clone ${input.git_url} ${input.repo_dir_name}`
			.cwd(input.user_paths.data)
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

const reset_repo: Procedure = {
	id: Symbol('reset repo'),
	run: async input => {
		const output = await $`git reset --hard`.cwd(input.octez_repo_path).quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

const git_checkout_master: Procedure = {
	id: Symbol('git checkout master'),
	run: async input => {
		const output = await $`git checkout master -q`
			.cwd(input.octez_repo_path)
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
	dependencies: [clone_repo, reset_repo],
}

const git_pull: Procedure = {
	id: Symbol('git pull'),
	run: async input => {
		const output = await $`git pull -q`.cwd(input.octez_repo_path).quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
	dependencies: [git_checkout_master],
}

const git_checkout_network_commit: Procedure = {
	id: Symbol('checkout network commit or branch'),
	run: async input => {
		const output = await $`git checkout ${input.tezos_network.git_ref}`
			.cwd(input.octez_repo_path)
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
	dependencies: [git_pull],
}

const patch_repo: Procedure = {
	id: Symbol('patch repo'),
	run: async input => {
		const patches_dir = path.join(
			input.user_paths.data,
			'patches',
			input.tezos_network.git_ref,
		)

		if (!fs.existsSync(patches_dir)) {
			return
		}

		const repo_path = path.join(input.user_paths.data, input.repo_dir_name)
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
	run: async input => {
		const output = await $`make build-deps`
			.cwd(`${path.join(input.user_paths.data, input.repo_dir_name)}`)
			.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
	dependencies: [patch_repo],
}

const make_binaries: Procedure = {
	async can_skip(input) {
		const repo_path = path.join(input.user_paths.data, input.repo_dir_name)
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
				(version && input.tezos_network.git_ref.endsWith(version)) ||
				input.tezos_network.git_hash === commit_hash,
		)
	},
	id: Symbol('make'),
	run: async input => {
		const repo_path = path.join(input.user_paths.data, input.repo_dir_name)
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
	async can_skip(input) {
		if (!fs.existsSync(input.bin_path)) {
			return false
		}

		const built_octez_binaries = await get_files({
			prefix: 'octez-',
			dir: input.bin_path,
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
				(version && input.tezos_network.git_ref.endsWith(version)) ||
				input.tezos_network.git_hash === commit_hash,
		)
	},
	id: Symbol('install octez binaries'),
	run: async input => {
		const repo_path = path.join(input.user_paths.data, input.repo_dir_name)
		const binaries = await get_files({
			dir: repo_path,
			prefix: 'octez-',
		})

		await mkdir(input.bin_path, { recursive: true })

		const binary_names = [...binaries].map(({ name }) => name)
		const move_result = await $`mv ${binary_names} ${input.bin_path}`
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
	run: async input => {
		const node_data_path = input.data_paths.get('node')
		const dal_data_path = input.data_paths.get('dal')
		const client_data_path = input.data_paths.get('client')
		const config_file_path = path.join(node_data_path, 'config.json')

		const bin_dir = path.join(input.user_paths.bin, input.tezos_network.git_ref)

		const octez_node_service_filename = input.service_file_names.get('node')
		const octez_baker_service_filename = input.service_file_names.get('baker')
		const octez_accuser_service_filename =
			input.service_file_names.get('accuser')
		const octez_dal_service_filename = input.service_file_names.get('dal')

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

		node_service.Unit.Description = `Octez Node - ${input.tezos_network.human_name}`
		node_service.Service.ExecStart = [
			path.join(bin_dir, 'octez-node'),
			'run',
			['--data-dir', node_data_path].join(' '),
		]
			.join(' ')
			.trim()
		node_service.Install.RequiredBy = [
			octez_baker_service_filename,
			octez_accuser_service_filename,
			octez_dal_service_filename,
		].join(' ')

		dal_service.Unit.Description = `Octez DAL - ${input.tezos_network.human_name}`
		dal_service.Service.ExecStart = [
			path.join(bin_dir, 'octez-dal-node'),
			'run',
			['--data-dir', dal_data_path].join(' '),
		]
			.join(' ')
			.trim()
		dal_service.Unit.After = octez_node_service_filename
		dal_service.Unit.BindsTo = octez_node_service_filename
		dal_service.Install.WantedBy = octez_node_service_filename

		baker_service.Unit.Description = `Octez Baker - ${input.tezos_network.human_name}`
		baker_service.Service.ExecStart = [
			path.join(
				bin_dir,
				`octez-baker-${input.tezos_network.last_baking_daemon}`,
			),
			'run',
			['--base-dir', client_data_path].join(' '),
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

		accuser_service.Unit.Description = `Octez Accuser - ${input.tezos_network.human_name}`
		accuser_service.Service.ExecStart = [
			path.join(
				bin_dir,
				`octez-accuser-${input.tezos_network.last_baking_daemon}`,
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
				path.join(input.user_paths.systemd, octez_node_service_filename),
				ini.stringify(node_service, {}),
			),
			write(
				path.join(input.user_paths.systemd, octez_baker_service_filename),
				ini.stringify(baker_service, {}),
			),
			write(
				path.join(input.user_paths.systemd, octez_accuser_service_filename),
				ini.stringify(accuser_service, {}),
			),
			write(
				path.join(input.user_paths.systemd, octez_dal_service_filename),
				ini.stringify(dal_service, {}),
			),
		])

		await Promise.all(
			[...input.service_file_names.values()].map(service_file_name =>
				$`systemctl --user enable ${service_file_name}`.quiet(),
			),
		)

		await $`systemctl --user daemon-reload`.quiet()
	},
	dependencies: [install_binaries],
}

export const build_procedures: Procedure[] = [create_service_files]
