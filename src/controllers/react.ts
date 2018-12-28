import * as Utils from '../utils';
import { RouterRouted } from '../utils/router';

export async function setReactTime(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.v.o.user)
  const userAt = Utils.User.buildUserChatAt(routed.v.o.user, userArgType)
  const newTime = routed.v.o.newtime

  await routed.message.channel.send(`:white_check_mark: Setting react time for ${userAt} to: \`${newTime}\` minutes`)
  routed.bot.DEBUG_MSG_COMMAND(`!react ${userAt} time ${newTime}`)
}