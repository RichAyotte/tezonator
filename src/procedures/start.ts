import { $ } from 'bun'
import type { Procedure } from '~/procedures/types'

const start_node: Procedure = {
	id: Symbol('start octez node'),
	run: async input => {
		const output =
			await $`systemctl --user start ${input.service_file_names.get(
				'node',
			)}`.quiet()
		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

const start_dal: Procedure = {
	id: Symbol('start octez dal'),
	run: async input => {
		const output =
			await $`systemctl --user start ${input.service_file_names.get(
				'dal',
			)}`.quiet()
		if (output.exitCode !== 0) {
			throw new Error(output.stderr.toString())
		}
	},
}

export const start_procedures: Procedure[] = [start_node, start_dal]
