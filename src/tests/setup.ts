import { expect } from 'bun:test'
import { toBeValidSchemaData } from '~/tests/matchers/to_be_valid_schema_data'

// biome-ignore lint/nursery/noMisplacedAssertion: not a valid instance
expect.extend({ toBeValidSchemaData })
