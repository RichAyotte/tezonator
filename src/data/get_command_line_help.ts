import { cyan, green } from 'colorette'
import package_json from '~/../package.json' assert { type: 'json' }
import { command_procedures } from '~/data/command_procedures'
import { tezos_network_names } from '~/data/network_names'
import { get_command_help_table } from '~/transformers/get_command_help_table'

const command_help_table = get_command_help_table({
	command_procedures,
})

export function get_command_line_help(): string {
	return `
${green('Tezonator')} - Tezos' little helper. (${package_json.version})

Usage: tez <command> <network>

Commands:
${command_help_table}

Neworks: ${[...tezos_network_names].map(name => `'${cyan(name)}'`).join(' ')}

Learn more about Tezonator:      https://tezonator.com/docs
Join our Discord community:      https://tezonator.com/discord
`
}
