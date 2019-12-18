import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { TextChannel } from 'discord.js'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Admin',
  commandTarget: 'none',
  controller: purgeChannelMessages,
  example: '{{prefix}}admin channel purge',
  name: 'admin-channel-purge',
  permissions: {
    defaultEnabled: false,
    serverAdminOnly: true
  },
  validate: '/admin:string/channel:string/purge:string'
})

/**
 * Purge Current Channel's Messages
 * @export
 * @param {RouterRouted} routed
 */
export async function purgeChannelMessages(routed: RouterRouted) {
  await Utils.Channel.cleanTextChat(<TextChannel>routed.message.channel, routed.bot.DEBUG_MSG_SCHEDULED)
  return true
}
