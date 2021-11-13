// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

import * as Utils from '@/utils'

import test from 'ava'

test('Utils:getArgs => Ensure proper parsing of args', t => {
  t.plan(2)
  t.is(Utils.getArgs(`${process.env.BOT_MESSAGE_PREFIX}decision  new  "Question goes here?"`).length, 3)
  t.is(Utils.getArgs(`${process.env.BOT_MESSAGE_PREFIX}decision wqdhwqd2j021DJW92 add "Question~!@#$%^&*(){}[];|,.<> goes here?"`).length, 4)
})

test('Utils:getArgs => Strip prefix', t => {
  t.is(Utils.getArgs(`${process.env.BOT_MESSAGE_PREFIX}decision test`)[0], 'decision')
})
