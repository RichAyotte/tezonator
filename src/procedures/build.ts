import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { $ } from 'bun'
import { get_binary_version_stdouts } from '~/data/get_binary_version_stdouts'
import { get_files } from '~/data/get_files'
import type { Procedure } from '~/procedures/types'
import type { ProcedureOptions } from '~/tezonator'
import { get_binary_version } from '~/transformers/get_binary_version'
import { get_filtered_obj } from '~/transformers/get_filtered_object'
import { get_sexp_object } from '~/transformers/get_sexp_object'

const clone_repo: Procedure<ProcedureOptions> = {
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

const reset_repo: Procedure<ProcedureOptions> = {
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

const git_checkout_master: Procedure<ProcedureOptions> = {
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

const git_pull: Procedure<ProcedureOptions> = {
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

const git_checkout_network_commit: Procedure<ProcedureOptions> = {
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

const patch_repo: Procedure<ProcedureOptions> = {
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

const make_build_deps: Procedure<ProcedureOptions> = {
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

const make_binaries: Procedure<ProcedureOptions> = {
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

const install_binaries: Procedure<ProcedureOptions> = {
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

		for (const binary of binaries) {
			const move_result = await $`mv ${binary} ${target_path}`
				.cwd(repo_path)
				.quiet()
			if (move_result.exitCode !== 0) {
				throw new Error(move_result.stderr.toString())
			}
		}
	},
	dependencies: [make_binaries],
}

export const build_procedures: Procedure<ProcedureOptions>[] = [
	install_binaries,
]
