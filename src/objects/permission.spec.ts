import test from 'ava';
import { CommandPermission } from './permission';

var permission1 = new CommandPermission({
  serverID: '111111222223333333',
  channelID: '222222222222222222',
  command: 'ping',
  enabled: false
})

test('CommandPermission => Test if permission is disabled', t => {
  t.is(permission1.isAllowed(), false)
})