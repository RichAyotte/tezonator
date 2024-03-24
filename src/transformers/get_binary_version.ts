import type { ParsedPath } from 'node:path'

type BinaryVersion = {
	bin_path: ParsedPath
	commit_hash?: string
	date?: Date
	version?: string
}

const regex =
	/(\w+) \((\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \+\d{4})\) \(([ \w.~+]+)\)/

type GetBinaryVersionInput = {
	bin_path: ParsedPath
	stdout: string
}

export function get_binary_version({
	bin_path,
	stdout,
}: GetBinaryVersionInput): BinaryVersion {
	const match = stdout.trim().match(regex)

	if (!match) {
		throw new Error(
			`${bin_path} version could not be determined. ${stdout.trim()}`,
		)
	}

	const [, commit_hash, date, version] = match
	return {
		bin_path,
		commit_hash,
		date: new Date(date),
		version,
	}
}
