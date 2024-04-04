import { parseArgs } from 'node:util'
import { argv } from 'bun'
import { command_procedures } from '~/data/command_procedures'
import { get_command_line_help } from '~/data/get_command_line_help'
import { get_tezos_networks } from '~/data/get_tezos_netwoks'
import {
	type TezosNetworkName,
	tezos_network_names,
} from '~/data/network_names'
import {
	type TezonatorCommandName,
	tezonator_command_names,
} from '~/data/tezonator_command_names'
import { is_item_in_set } from '~/flow/is_item_in_set'
import { run_procedures } from '~/flow/run_procedures'
import { create_user_paths } from '~/procedures/create_user_paths'
import type { ProcedureOptions } from '~/procedures/types'
import { get_tezos_network } from '~/transformers/get_tezos_network'

const { positionals, values: command_options } = parseArgs({
	args: argv,
	options: {
		force: {
			type: 'boolean',
		},
	},
	strict: true,
	allowPositionals: true,
})

const [, , command, network_name] = positionals

export { command_options }

if (!command) {
	console.log(get_command_line_help())
	process.exit()
}

if (!is_item_in_set<TezonatorCommandName>(command, tezonator_command_names)) {
	throw new Error(
		`invalid command. Command must be one of ${[
			...tezonator_command_names,
		].join(', ')} `,
	)
}

if (!is_item_in_set<TezosNetworkName>(network_name, tezos_network_names)) {
	throw new Error(
		`invalid network name. Network must be one of ${[
			...tezos_network_names,
		].join(', ')} `,
	)
}

const tezos_networks = await get_tezos_networks()

const tezos_network = get_tezos_network({
	tezos_networks,
	prefix: network_name,
})

if (!tezos_network) {
	throw new Error(
		`Could not find the ${network_name} in the remote configuration.`,
	)
}

const procedure_options: ProcedureOptions = {
	git_url: 'https://gitlab.com/tezos/tezos.git',
	repo_dir: 'tezos',
	tezos_network,
	user_paths: await create_user_paths(),
	command_options,
}

const tezonator_command = command_procedures.get(command)

if (!tezonator_command) {
	console.error(`No procedures found for commmand ${command}`)
	process.exit(1)
}

if (tezonator_command.procedures) {
	await run_procedures({
		procedures: tezonator_command.procedures,
		procedure_options,
	})
}
