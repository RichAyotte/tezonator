import type { TezonatorCommandName } from '~/data/tezonator_command_names'
import { build_procedures } from '~/procedures/build'
import { init_procedures } from '~/procedures/init'
import { start_procedures } from '~/procedures/start'
import type { Procedure } from '~/procedures/types'

export type TezonatorCommand = {
	procedures: Procedure[]
	description: string
	arguments?: string[]
	options?: string[]
}

export const command_procedures = new Map<
	TezonatorCommandName,
	TezonatorCommand
>([
	[
		'build',
		{ description: 'Build the Octez binaries', procedures: build_procedures },
	],
	[
		'init',
		{
			description: 'Initialise the configuration',
			procedures: init_procedures,
		},
	],
	[
		'start',
		{
			description: 'Start the Octez applications',
			procedures: start_procedures,
		},
	],
])
