import test from 'ava';
import * as Utils from './utils';

test('Utils:getArgs => Ensure proper parsing of args', t => {
  t.plan(3)
  t.is(Utils.getArgs(`!decision  new  "Question goes here?"`).length, 3)
  t.is(Utils.getArgs(`!decision  new  'Question goes here?'`).length, 3)
  t.is(Utils.getArgs(`!decision wqdhwqd2j021DJW92 add "Question~!@#$%^&*(){}[];|,.<> goes here?"`).length, 4)
})