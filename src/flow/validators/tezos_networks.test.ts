import { expect, test } from 'bun:test'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { tezos_networks_schema } from '~/flow/validators/tezos_networks'
import tezos_networks from '~/tests/fixtures/teztnets.json'

const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

test('validate tezos network', () => {
	const validate_tezos_networks = ajv.compile(tezos_networks_schema)
	expect(tezos_networks).toBeValidSchemaData(validate_tezos_networks)
})
