const commands = [
	'build',
	'init',
	'monitor',
	'remove',
	'start',
	'status',
	'update',
] as const
export type TezonatorCommand = (typeof commands)[number]
export const tezonator_commands = new Set<TezonatorCommand>(commands)
