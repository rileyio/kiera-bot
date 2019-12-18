require('dotenv').config()
import test from 'ava'
import { sb, en } from '@/utils'

test('StringBuilder => Test a string', t => {
  t.is(typeof en.help.ck === 'string', true)
})

test('StringBuilder => Test loading a string w/overrides', t => {
  const final = sb(`{{prefix}}test{{prefix}}`, { prefix: '!' })
  t.is(final, '!test!')
})

test('StringBuilder => Test globals', t => {
  const final = sb(`{{prefix}}test{{prefix}}`)
  t.is(final, `${process.env.BOT_MESSAGE_PREFIX}test${process.env.BOT_MESSAGE_PREFIX}`)
})
