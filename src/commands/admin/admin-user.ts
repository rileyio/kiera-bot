import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedUser } from '@/objects/user'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Admin',
  controller: removeUser,
  example: '{{prefix}}admin user delete @user#0000',
  name: 'admin-user-delete',
  permissions: {
    restricted: true,
    restrictedTo: [
      '473856245166506014', // KevinCross#0001
      '146439529824256000' /// Emma#1366
    ]
  },
  validate: '/admin:string/user:string/delete:string/user=user'
})

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

  if (removed === 0) return true // Stop here if nothing is removed
  // Process command
  await routed.message.reply(`:white_check_mark: Removing user ${Utils.User.buildUserChatAt(user, userArgType)} from db`)
  routed.bot.Log.Command.log(`!admin user delete ${Utils.User.buildUserChatAt(user, userArgType)}`)

  return true
}
