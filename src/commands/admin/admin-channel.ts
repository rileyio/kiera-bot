import * as Middleware from '../../middleware';
import * as Utils from '../../utils/';
import { RouterRouted } from '../../router/router';
import { TextChannel } from 'discord.js';
import { ExportRoutes } from '../../router/routes-exporter';

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Admin',
  commandTarget: 'none',
  controller: purgeChannelMessages,
  example: '{{prefix}}admin channel purge',
  name: 'admin-channel-purge',
  permissions: {
    restricted: true
  },
  validate: '/admin:string/channel:string/purge:string',
  middleware: [
    Middleware.hasRole('Developer')
  ]
})

/**
 * Purge Current Channel's Messages
 * @export
 * @param {RouterRouted} routed
 */
export async function purgeChannelMessages(routed: RouterRouted) {
  await Utils.Channel.cleanTextChat(
    <TextChannel>routed.message.channel,
    routed.bot.DEBUG_MSG_SCHEDULED
  )
  return true
}