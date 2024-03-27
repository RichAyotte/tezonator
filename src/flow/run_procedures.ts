import { green, red } from 'colorette'
import ora, { oraPromise } from 'ora'
import type { Procedure } from '~/procedures/types'

type RunProceduresInput<T> = {
	procedures: Procedure<T>[]
	procedure_options: T
}

export async function run_procedures<T>({
	procedures,
	procedure_options,
}: RunProceduresInput<T>) {
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
			await oraPromise(
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
