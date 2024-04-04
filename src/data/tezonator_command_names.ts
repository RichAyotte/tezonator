const command_names = ['build', 'init', 'start'] as const
export type TezonatorCommandName = (typeof command_names)[number]
export const tezonator_command_names = new Set<TezonatorCommandName>(
	command_names,
)
