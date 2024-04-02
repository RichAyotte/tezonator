import type { TezonatorCommand } from '~/data/tezonator_commands'
import { build_procedures } from '~/procedures/build'
import { init_procedures } from '~/procedures/init'
import { start_procedures } from '~/procedures/start'
import type { Procedure } from '~/procedures/types'

export const command_procedures = new Map<TezonatorCommand, Procedure[]>([
	['build', build_procedures],
	['init', init_procedures],
	['start', start_procedures],
])
