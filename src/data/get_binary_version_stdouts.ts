import { format } from 'node:path'
import type { ParsedPath } from 'node:path'
import { $ } from 'bun'

type GetBinaryVersionStdoutsInput = {
	built_octez_binaries: Set<ParsedPath>
}

type GetBinaryVersionStdoutsOuput = {
	bin_path: ParsedPath
	stdout: string
}

export async function get_binary_version_stdouts({
	built_octez_binaries,
}: GetBinaryVersionStdoutsInput): Promise<GetBinaryVersionStdoutsOuput[]> {
	return Promise.all(
		[...built_octez_binaries].map(
			async (bin_path): Promise<GetBinaryVersionStdoutsOuput> => {
				const stdout = await $`${format(bin_path)} --version`.text()
				return {
					bin_path,
					stdout,
				}
			},
		),
	)
}
