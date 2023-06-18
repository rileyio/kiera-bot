// require('dotenv').config()

// import test from 'ava'
// import { MongoDB } from '@/db'
// import { TrackedUser } from '#objects/user/index'

// const db = new MongoDB()
// const newUser = new TrackedUser({
//   id: '526039977247899649',
//   username: 'ldi-bot',
//   discriminator: '9713'
// })

// test('DB:insert => Insert a record', async t => {
//   const added = await db.add('users', newUser)
//   t.not(added, null)
// })

// test('DB:verify => Verify records (do not)exist', async t => {
//   t.plan(2)
//   t.true(await db.verify('users', '526039977247899649'))
//   t.false(await db.verify('users', '526039977247899650'))
// })

// test('DB:update => Update record', async t => {
//   t.is(await db.update<TrackedUser>('users', { id: '526039977247899649' }, { discriminator: '0000' }), 1)
// })

// test('DB:get => Get record', async t => {
//   const fetched = new TrackedUser(await db.get('users', { id: '526039977247899649' }))
//   t.is(fetched.id, '526039977247899649')
// })

// test('DB:remove => Remove record', async t => {
//   t.is(await db.remove('users', { id: '526039977247899649' }), 1)
// })
