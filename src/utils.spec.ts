import test from 'ava';
import * as Utils from './utils';

test('Utils:Validate => Generate Validate', t => {
  t.is(Utils.getArgs('!decision  new  "Question goes here?"').length, 3)
})