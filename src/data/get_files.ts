import { readdir } from 'node:fs/promises'
import type { ParsedPath } from 'node:path'
import path from 'node:path'

type GetFilesOptions = {
	dir: string
	prefix?: string
	suffix?: string
}

export async function get_files(
	options: GetFilesOptions,
): Promise<Set<ParsedPath>> {
	const entries = await readdir(options.dir, { withFileTypes: true })

	return new Set(
		entries
			.filter(entry => {
				if (!entry.isFile()) {
					return
				}

				if (options.prefix && options.suffix) {
					entry.name.startsWith(options.prefix) &&
						entry.name.endsWith(options.suffix)
				}

				if (options.prefix) {
					return entry.name.startsWith(options.prefix)
				}

				if (options.suffix) {
					return entry.name.endsWith(options.suffix)
				}

				return true
			})
			.map(file => path.parse(path.join(options.dir, file.name))),
	)
}
