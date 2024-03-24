import type { CustomMatcher, MatcherResult } from 'bun:test'
import type { ValidateFunction } from 'ajv'

export const toBeValidSchemaData: CustomMatcher<unknown, [ValidateFunction]> =
	function (data, validate): MatcherResult {
		const pass: boolean = validate(data)
		const matcher_result: MatcherResult = {
			pass,
		}

		if (!pass) {
			matcher_result.message = () =>
				validate.errors
					?.map(error => {
						return `Expected: ${this.utils.printExpected(
							error.instancePath,
						)} \nReceived: ${this.utils.printReceived(error.data)}\n`
					})
					.join('\n') ?? 'errors could not be determined'
		}

		return matcher_result
	}
