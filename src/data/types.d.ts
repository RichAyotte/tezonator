import 'bun:test'
import type { ValidateFunction } from 'ajv'

declare module 'bun:test' {
	interface Matchers<R> {
		toBeValidSchemaData(expected: ValidateFunction): R
	}
}
