import { expect } from 'bun:test'
import { toBeValidSchemaData } from '~/tests/matchers/to_be_valid_schema_data'

expect.extend({ toBeValidSchemaData })
