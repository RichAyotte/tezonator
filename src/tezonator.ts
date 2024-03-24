import { parseArgs } from 'node:util'
import { argv } from 'bun'
import { command_procedures } from '~/data/command_procedures'
import { get_tezos_networks } from '~/data/get_tezos_netwoks'
import {
	type TezosNetworkName,
	tezos_network_names,
} from '~/data/network_names'
import {
	type TezonatorCommand,
	tezonator_commands,
} from '~/data/tezonator_commands'
import { is_item_in_set } from '~/flow/is_item_in_set'
import { run_procedures } from '~/flow/run_procedures'
import type { TezosNetwork } from '~/flow/validators/tezos_networks'
import { validate_tezos_networks } from '~/flow/validators/tezos_networks'
import { validate_tezos_network } from '~/flow/validators/tezos_networks'
import type { UserPaths } from '~/procedures/create_user_paths'
import { create_user_paths } from '~/procedures/create_user_paths'
import { get_tezos_network } from '~/transformers/get_tezos_network'

export type ProcedureOptions = {
	git_url: string
	repo_dir: string
	tezos_network: TezosNetwork
	user_paths: UserPaths
}

const { positionals } = parseArgs({
	args: argv,
	strict: true,
	allowPositionals: true,
})

const [, , command, network_name] = positionals

if (!is_item_in_set<TezonatorCommand>(command, tezonator_commands)) {
	throw new Error(
		`invalid command. Command must be one of ${[...tezonator_commands].join(
			', ',
		)} `,
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
}

const procedures = command_procedures.get(command)

if (procedures) {
	await run_procedures<ProcedureOptions>({ procedures, procedure_options })
}
