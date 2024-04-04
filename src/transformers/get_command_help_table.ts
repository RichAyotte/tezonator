import { cyan } from 'colorette'
import columnify from 'columnify'
import type { TezonatorCommand } from '~/data/command_procedures'
import type { TezonatorCommandName } from '~/data/tezonator_command_names'

export function get_command_help_table({
	command_procedures,
}: {
	command_procedures: Map<TezonatorCommandName, TezonatorCommand>
}): string {
	return columnify(
		[...command_procedures]
			.map(([name, { description }]) => ({
				indent: ' ',
				name: `${cyan(name)} <network>`,
				description,
			}))
			.sort(),
		{
			showHeaders: false,
			minWidth: 20,
			config: {
				indent: {
					minWidth: 1,
				},
			},
		},
	)
}
