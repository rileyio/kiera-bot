import { verifyUserRefType, buildUserQuery, buildUserChatAt } from "../utils";
import { RouterRouted } from "../utils/router";

export async function adminRemoveUser(routed: RouterRouted) {
  const userArgType = verifyUserRefType(routed.v.o.user)
  const userQuery = buildUserQuery(routed.v.o.user, userArgType)

  const user = await routed.bot.Users.get(userQuery)
  const removed = await routed.bot.Users.remove(userQuery)

  if (removed === 0) return; // Stop here if nothing is removed
  // Process command
  await routed.message.reply(`:white_check_mark: Removing user ${buildUserChatAt(user, userArgType)} from db`)
  routed.bot.DEBUG_MSG_COMMAND(`!admin user delete ${buildUserChatAt(user, userArgType)}`)
}