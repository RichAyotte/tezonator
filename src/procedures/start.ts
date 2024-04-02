import { $ } from 'bun'
import type { Procedure } from '~/procedures/types'
import { get_service_file_name } from '~/transformers/get_service_file_name'

const start_node: Procedure = {
	id: Symbol('start octez node'),
	run: async options => {
		const service_file_name = get_service_file_name({
			tezos_network: options.tezos_network,
			service_name: 'node',
		})

		const output = await $`systemctl --user start ${service_file_name}`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

const start_dal: Procedure = {
	id: Symbol('start octez dal'),
	run: async options => {
		const service_file_name = get_service_file_name({
			tezos_network: options.tezos_network,
			service_name: 'dal',
		})

		const output = await $`systemctl --user start ${service_file_name}`.quiet()

		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

export const start_procedures: Procedure[] = [start_node, start_dal]
