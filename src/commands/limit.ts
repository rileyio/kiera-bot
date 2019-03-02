import * as Middleware from '../middleware';
import * as Utils from '../utils/';
import { RouterRouted } from '../router/router';
import { DeviceSession } from '../objects/sessions';
import { TrackedUser } from '../objects/user';
import { ExportRoutes } from '../router/routes-exporter';

export const Routes = ExportRoutes(
  {
    type: 'message',
    commandTarget: 'argument',
    controller: setUserSessionTimeLimit,
    example: '{{prefix}}limit session time 10',
    name: 'limit-set-session-limits',
    validate: '/limit:string/session:string/key=string/value=number',
    middleware: [
      Middleware.hasRole(['lockee', 'developer'])
    ]
  }
)

export async function setUserSessionTimeLimit(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)
  const newValue = routed.v.o.value
  const key = routed.v.o.key
  // Command contains either time or intensity
  const isTimeOrIntensity = key === 'time' || key === 'intensity'
  // Ensure its one of these 2 or throw error
  if (!isTimeOrIntensity) {
    await routed.message.reply(
      `must be \`!limit session time ${newValue}\` or \`!limit session intensity ${newValue}\``)
    return false
  }

  // Get user's _id from the db
  const targetUser = await routed.bot.DB.get<TrackedUser>('users', userQuery)

  // Ensure user is setup & has a session
  if (!targetUser) {
    await routed.message.reply(
      `Make sure you've used the following: \`!register\``)
    return false
  }

  const userSession = await routed.bot.DB.get<TrackedUser>('sessions', {
    uid: targetUser._id,
    isActive: false,
    isDeactivated: false,
    isCompleted: false,
  })

  // Ensure session exists
  if (!userSession) {
    await routed.message.reply(
      `You need to create a session \`!session new lovense\``)
    return false
  }

  // Update props
  const nsession = new DeviceSession(userSession)
  nsession.limit[key] = newValue

  // Update the existing user session record in the db
  await routed.bot.DB.update<DeviceSession>('sessions', { _id: userSession._id }, nsession)

  // Process command
  const timeOrIntensityStr = key === 'time' ? 'minutes' : '%'
  await routed.message.reply(`:white_check_mark: Setting your ${key} limit to: \`${newValue}\` ${timeOrIntensityStr}`)
  routed.bot.DEBUG_MSG_COMMAND.log(`!limit time ${newValue}`)
  return true
}