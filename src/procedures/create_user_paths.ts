import { mkdir } from 'node:fs/promises'
import path from 'node:path'

export type UserPaths = {
	bin: string
	config: string
	data: string
	home: string
	systemd: string
}

const min_home_length = 5 // just enough for /root

export async function create_user_paths(): Promise<UserPaths> {
	const base_name = 'tezonator'
	const home = process.env.HOME

	if (!home || typeof home !== 'string') {
		throw new Error(`process.env.HOME isn't set.`)
	}

	if (home.length < min_home_length) {
		throw new Error(
			`process.env.HOME is too short. The minimum length is ${min_home_length} and we found "${home}" which is ${home.length} characters`,
		)
	}

	const config = process.env.XDG_CONFIG_HOME
		? path.join(process.env.XDG_CONFIG_HOME, base_name)
		: path.join(home, '.config', base_name)
	const data = process.env.XDG_DATA_HOME
		? path.join(process.env.XDG_DATA_HOME, base_name)
		: path.join(home, '.local', 'share', base_name)
	const bin = path.join(home, '.local', 'bin', base_name)
	const systemd = path.join(home, '.local', 'share', 'systemd', 'user')

	await Promise.all([
		mkdir(bin, { recursive: true }),
		mkdir(config, { recursive: true }),
		mkdir(data, { recursive: true }),
		mkdir(home, { recursive: true }),
		mkdir(systemd, { recursive: true }),
	])

	return {
		bin,
		config,
		data,
		home,
		systemd,
	}
}
