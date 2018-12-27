require('dotenv').config()

import test from 'ava';
import { DB } from './database-2';
import { TrackedUser } from '../objects/user';

const db = new DB<TrackedUser>('users');
const newUser = new TrackedUser({
  id: '146439529824256000',
  username: 'emma',
  discriminator: '1366',
  createdTimestamp: 1454984304625
})

test('DB2:insert => Insert a record', async t => {
  const added = await db.add(newUser)
  t.is(added.id, newUser.id)
})

test('DB2:verify => Verify records (do not)exist', async t => {
  t.plan(2)
  t.true(await db.verify('146439529824256000'))
  t.false(await db.verify('146439529824256001'))
})

test('DB2:update => Update record', async t => {
  t.true(await db.update({ id: '146439529824256000' }, { $set: { discriminator: '0000' } }))
})

test('DB2:get => Get record', async t => {
  const fetched = new TrackedUser(await db.get({ id: '146439529824256000' }))
  t.is(fetched.id, '146439529824256000')
})

test('DB2:remove => Remove record', async t => {
  t.is(await db.remove({ id: '146439529824256000' }), 1)
})