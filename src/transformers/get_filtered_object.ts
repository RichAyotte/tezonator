export function get_filtered_obj(
	obj: Record<string, string | undefined>,
): Record<string, string> {
	return Object.fromEntries(
		Object.entries(obj).filter((kv): kv is [string, string] => {
			const [, value] = kv
			return typeof value === 'string'
		}),
	)
}
