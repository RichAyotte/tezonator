import { describe, expect, test } from 'bun:test'
import { get_binary_version } from './get_binary_version'

const bin_path = {
	root: '/',
	dir: '/home/rich/.local/bin/tezonator/0a81ce76',
	base: 'octez-client',
	ext: '',
	name: 'octez-client',
}

describe('get_binary_version', () => {
	test('(Octez 0.0+dev)', () => {
		expect(
			get_binary_version({
				bin_path,
				stdout: '0a81ce76 (2024-03-19 17:09:20 +0000) (Octez 0.0+dev)\n',
			}),
		).toMatchSnapshot()
	})
	test('(18.0~rc1+dev)', () => {
		expect(
			get_binary_version({
				bin_path,
				stdout: 'cae5b795 (2024-02-29 10:34:23 +0000) (18.0~rc1+dev)\n',
			}),
		).toMatchSnapshot()
	})
})
