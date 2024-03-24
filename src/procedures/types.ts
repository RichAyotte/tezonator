export type Procedure<T> = {
	id: symbol
	run: (options: T) => Promise<void>
	can_skip?: (options: T) => Promise<boolean>
	dependencies?: Procedure<T>[]
}

export type ProcedureResult = {
	message: string
	is_success: boolean
}
