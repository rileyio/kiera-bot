require('dotenv').config()

import test from 'ava';
import { MongoDB } from './database-mongo';
import { TrackedUser } from '../objects/user';

const db = new MongoDB<TrackedUser>('users');
const newUser = new TrackedUser({
  id: '526039977247899649',
  username: 'ldi-bot',
  discriminator: '9713',
  createdTimestamp: 1454984304625
})

test('DB2:insert => Insert a record', async t => {
  const added = await db.add(newUser)
  t.is(added.id, newUser.id)
})

test('DB2:verify => Verify records (do not)exist', async t => {
  t.plan(2)
  t.true(await db.verify('526039977247899649'))
  t.false(await db.verify('526039977247899650'))
})

test('DB2:update => Update record', async t => {
  t.is(await db.update({ id: '526039977247899649' }, { discriminator: '0000' }), 1)
})

test('DB2:get => Get record', async t => {
  const fetched = new TrackedUser(await db.get({ id: '526039977247899649' }))
  t.is(fetched.id, '526039977247899649')
})

test('DB2:remove => Remove record', async t => {
  t.is(await db.remove({ id: '526039977247899649' }), 1)
})