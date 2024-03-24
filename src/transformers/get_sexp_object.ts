export function get_sexp_object(sexp: string): Record<string, string> {
	const entries = sexp
		.trim()
		.slice(2, -2)
		.split('\n')
		.filter(Boolean)
		.map(line => {
			return line.trim().slice(2, -2).split('" "')
		})
	return Object.fromEntries(entries)
}
