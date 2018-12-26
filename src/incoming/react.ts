import { verifyUserRefType, buildUserChatAt } from "../utils";
import { RouterRouted } from "../utils/router";

export async function setReactTime(routed: RouterRouted) {
  const userArgType = verifyUserRefType(routed.v.o.user)

  await routed.message.reply(`:white_check_mark: Setting react time for ${buildUserChatAt(routed.v.o.user, userArgType)} to: \`${routed.v.o.newtime}\` minutes`)
  routed.bot.DEBUG_MSG_COMMAND(`!react ${buildUserChatAt(routed.v.o.user, userArgType)} time ${routed.v.o.newtime}`)
}