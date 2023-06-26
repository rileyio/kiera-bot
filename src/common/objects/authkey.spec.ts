import { AuthKey } from './authkey'
import test from 'ava'

const authKey = new AuthKey()
let key: string

test('AuthKey:Generate => create new key', t => {
  t.plan(2)
  key = authKey.generate('ldi-bot', 1)
  t.not(key, undefined)
  t.not(authKey.hash, undefined)
})

test('AuthKey:Verify => verify key', t => {
  t.true(authKey.test(key))
})
