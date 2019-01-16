import test from 'ava';
import * as Utils from './utils';

test('Utils:getArgs => Ensure proper parsing of args', t => {
  t.plan(2)
  t.is(Utils.getArgs(`!decision  new  "Question goes here?"`).length, 3)
  t.is(Utils.getArgs(`!decision  new  'Question goes here?'`).length, 3)
})