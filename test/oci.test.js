import test from 'ava'
import debug from '@watchmen/debug'
import {initHostWork} from '@watchmen/containr/util'

const dbg = debug(import.meta.url)

test.beforeEach(async () => {
  await initHostWork()
})

test('dummy', (t) => {
  dbg('dummy')
  t.pass()
})
