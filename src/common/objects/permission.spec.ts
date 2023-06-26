import { CommandPermission } from './permission'
import test from 'ava'

const permission1 = new CommandPermission({
  channelID: '222222222222222222',
  command: 'ping',
  enabled: false,
  serverID: '111111222223333333'
})

test('CommandPermission => Test if permission is disabled', (t) => {
  t.is(permission1.isAllowed(), false)
})
