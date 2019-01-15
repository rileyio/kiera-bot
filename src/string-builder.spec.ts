import test from 'ava';
import { sb, en } from './string-builder';

test('StringBuilder => Test a string', t => {
  t.is(typeof en.help.ck === 'string', true)
})

test('StringBuilder => Test loading a string', t => {
  const final = sb(`{{prefix}}test{{prefix}}`, { prefix: '!' })
  t.is(final, '!test!')
})
