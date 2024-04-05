import path from 'node:path'
import { green, red } from 'colorette'
import ora from 'ora'
import progress_estimator from 'progress-estimator'
import type { Procedure, ProcedureInput } from '~/procedures/types'

type RunProceduresInput = {
	procedures: Procedure[]
	procedure_input: ProcedureInput
}

export async function run_procedures({
	procedures,
	procedure_input,
}: RunProceduresInput) {
	const log_estimate = progress_estimator({
		storagePath: path.join(
			procedure_input.user_paths.config,
			'progress-estimator',
		),
	})

	for (const procedure of procedures) {
		if (typeof procedure.can_skip === 'function') {
			const spinner = ora(`can skip ${procedure.id.description}?`).start()
			const can_skip = await procedure?.can_skip(procedure_input)
			spinner.suffixText = can_skip ? green('yes') : red('no')
			spinner.info()
			if (can_skip) {
				continue
			}
		}
		if (procedure.dependencies) {
			await run_procedures({
				procedures: procedure.dependencies,
				procedure_input,
			})
		}
		try {
			await log_estimate(
				procedure.run(procedure_input),
				`running ${procedure.id.description}`,
			)
		} catch (error) {
			if (error instanceof Error) {
				console.error(error.message)
			} else {
				console.error(error)
			}
			process.exit(1)
		}
	}
}
