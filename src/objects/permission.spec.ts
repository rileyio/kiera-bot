import test from 'ava';
import { CommandPermissions, CommandPermissionsAllowed } from './permission';
import { Permissions } from '../permissions/';
/*
 * Priority:  user > channel > role > server
 */

var permission1 = new CommandPermissions({
  serverID: '111111222223333333',
  command: 'ping',
  enabled: true,
  allowed: [
    new CommandPermissionsAllowed({
      type: 'channel',
      target: '44444455555'
    }),
    new CommandPermissionsAllowed({
      type: 'channel',
      target: '77777777',
      allow: false,
      exceptions: [
        new CommandPermissionsAllowed({
          type: 'user',
          target: '00000000',
          allow: true
        })
      ]
    })
  ]
})

test('Permission:VerifyPermissions => Channel Matched, Command Enabled, User should not matter', t => {
  t.is(Permissions.VerifyCommandPermissions([permission1]).command('ping').end({
    user: '000000001', // Does not match
    channel: '44444455555', // Matches server #1
    role: 'developer'
  }), true)
})

test('Permission:VerifyPermissions => Channel Matched, Command disabled, User exception: allowed', t => {
  t.is(Permissions.VerifyCommandPermissions([permission1]).command('ping').end({
    user: '00000000',
    channel: '77777777',
    role: 'developer'
  }), true)
})

test('Permission:VerifyPermissions => Channel matched, Command disabled, User not Matched', t => {
  t.is(Permissions.VerifyCommandPermissions([permission1]).command('ping').end({
    user: '000000001',
    channel: '77777777',
    role: 'developer'
  }), false)
})

test('Permission:VerifyPermissions => No permissions defined', t => {
  t.is(Permissions.VerifyCommandPermissions([]).command('ping').end({
    user: '000000001',
    channel: '77777777',
    role: 'developer'
  }), true)
})



// const serverPermissions = [
//   {
//     sid: '11000020020020',
//     command: 'ping',
//     allowed: [
//       { type: 'channel', target: 'bot-testing', allow: true },
//       {
//         type: 'channel', target: 'private-test', allow: false, exceptionAllow: [
//           { type: 'user', target: 'emma' },
//           { type: 'role', target: 'developer' }
//         ]
//       }
//     ]
//   }
// ]