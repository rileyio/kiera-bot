import * as Utils from '../../utils';
import { RouterRouted } from '../../utils/router';

/**
 * Remove user from DB
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function removeUser(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.v.o.user)
  const userQuery = Utils.User.buildUserQuery(routed.v.o.user, userArgType)

  const user = await routed.bot.Users.get(userQuery)
  const removed = await routed.bot.Users.remove(userQuery)

  if (removed === 0) return; // Stop here if nothing is removed
  // Process command
  await routed.message
    .reply(`:white_check_mark: Removing user ${Utils.User.buildUserChatAt(user, userArgType)} from db`)
  routed.bot.DEBUG_MSG_COMMAND.log(`!admin user delete ${Utils.User.buildUserChatAt(user, userArgType)}`)

  return true
}