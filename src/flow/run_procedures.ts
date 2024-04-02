import { green, red } from 'colorette'
import ora from 'ora'
import type { Procedure, ProcedureOptions } from '~/procedures/types'
import progress_estimator from 'progress-estimator'
import path from 'node:path'

type RunProceduresInput = {
	procedures: Procedure[]
	procedure_options: ProcedureOptions
}

export async function run_procedures({
	procedures,
	procedure_options,
}: RunProceduresInput) {
	const log_estimate = progress_estimator({
		storagePath: path.join(
			procedure_options.user_paths.config,
			'progress-estimator',
		),
	})

	for (const procedure of procedures) {
		if (typeof procedure.can_skip === 'function') {
			const spinner = ora(`can skip ${procedure.id.description}?`).start()
			const can_skip = await procedure?.can_skip(procedure_options)
			spinner.suffixText = can_skip ? green('yes') : red('no')
			spinner.info()
			if (can_skip) {
				continue
			}
		}
		if (procedure.dependencies) {
			await run_procedures({
				procedures: procedure.dependencies,
				procedure_options,
			})
		}
		try {
			await log_estimate(
				procedure.run(procedure_options),
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
