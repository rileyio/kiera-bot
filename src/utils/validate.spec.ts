import test from 'ava'
import { Validate } from './validate'
import { getArgs } from '../utils';

var validate: Validate;

test('Utils:Validate => Generate Validate', t => {
  t.plan(2)
  validate = new Validate('/ck:string/ticker:string/set:string/type:string/value?=number')
  // Should contain 5 args
  t.is(validate.validation.length, 5)
  // With only one that's optional (.required === false)
  t.is(validate.validation.filter(_v => !_v.required).length, 1)
})

test('Utils:Validate => Incoming args', t => {
  const v = validate.validateArgs(getArgs('!ck ticker set type 2'))
  // Verify that its passed all the args successfully
  t.true(v.valid)
})

test('Utils:Validate => Object generator', t => {
  const v = validate.validateArgs(getArgs('!ck ticker set type 2'))
  // Validate object generator & output
  t.deepEqual(v.o, { ck: 'ck', ticker: 'ticker', set: 'set', type: 'type', value: 2 })
})

test('Utils:Validate => Route Regex generator', t => {
  const v = validate.routeSignatureFromStr('/ck:string/ticker:string/set:string/type:string/value?=number')
  // Validate object generator & output
  t.pass()
})
