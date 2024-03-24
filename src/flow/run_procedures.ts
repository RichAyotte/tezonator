import { oraPromise } from 'ora'
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
			const can_skip = await procedure?.can_skip(procedure_options)
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
				procedure.id.description,
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
