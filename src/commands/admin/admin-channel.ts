import * as Utils from '../../utils/';
import { RouterRouted } from '../../router/router';
import { TextChannel } from 'discord.js';

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