import * as Middleware from '../../middleware';
import * as Utils from '../../utils/';
import { RouterRouted } from '../../router/router';
import { TrackedUser } from '../../objects/user';
import { ExportRoutes } from '../../router/routes-exporter';

export const Routes = ExportRoutes(
  {
    type: 'message',
    commandTarget: 'argument',
    controller: removeUser,
    example: '{{prefix}}admin user delete @user#0000',
    name: 'admin-user-delete',
    permissions: {
      restricted: true
    },
    validate: '/admin:string/user:string/delete:string/user=user',
    middleware: [
      Middleware.hasRole('developer')
    ]
  }
)

/**
 * Remove user from DB
 * @export
 * @param {RouterRouted} routed
 * @returns
 */
export async function removeUser(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.v.o.user)
  const userQuery = Utils.User.buildUserQuery(routed.v.o.user, userArgType)

  const user = await routed.bot.DB.get<TrackedUser>('users', userQuery)
  const removed = await routed.bot.DB.remove('users', userQuery)

  if (removed === 0) return; // Stop here if nothing is removed
  // Process command
  await routed.message
    .reply(`:white_check_mark: Removing user ${Utils.User.buildUserChatAt(user, userArgType)} from db`)
  routed.bot.DEBUG_MSG_COMMAND.log(`!admin user delete ${Utils.User.buildUserChatAt(user, userArgType)}`)

  return true
}