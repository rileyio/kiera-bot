import * as Utils from '../utils';
import { RouterRouted } from '../utils/router';

export async function setDurationTime(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.v.o.user)
  const userAt = Utils.User.buildUserChatAt(routed.v.o.user, userArgType)

  // Process command
  await routed.message.reply(`:white_check_mark: Setting duration for ${userAt} to: \`${routed.v.o.newtime}\` minutes`)
  routed.bot.DEBUG_MSG_COMMAND(`!duration ${userAt} time ${routed.v.o.newtime}`)
}