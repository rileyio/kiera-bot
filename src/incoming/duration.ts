import { verifyUserRefType, buildUserChatAt } from "../utils";
import { RouterRouted } from "../utils/router";

export async function setDurationTime(routed: RouterRouted) {
  const userArgType = verifyUserRefType(routed.v.o.user)

  // Process command
  await routed.message.reply(`:white_check_mark: Setting duration for ${buildUserChatAt(routed.v.o.user, userArgType)} to: \`${routed.v.o.newtime}\` minutes`)
  routed.bot.DEBUG_MSG_COMMAND(`!duration ${buildUserChatAt(routed.v.o.user, userArgType)} time ${routed.v.o.newtime}`)
}