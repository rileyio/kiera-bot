import test from 'ava';
import { Validate } from './validate';
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

test('Utils:Validate => Multiple similar signatures', t => {
  t.plan(4)
  const v1 = new Validate('/help:string/command=string')
  const v2 = new Validate('/help:string')

  t.is(v1.test('!help ck'), true)
  t.is(v1.test('!help'), false)
  t.is(v2.test('!help ck'), false)
  t.is(v2.test('!help'), true)
})
