import * as Middleware from '../../middleware';
import * as Utils from '../../utils';
import { RouterRouted } from '../../router/router';
import { DeviceSession } from '../../objects/sessions';
import { TrackedChannel } from '../../objects/channel';
import { TrackedUser } from '../../objects/user';
import { ExportRoutes } from '../../router/routes-exporter';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Integration',
    commandTarget: 'argument',
    controller: setDurationTime,
    example: '{{prefix}}duration @user#0000 time 10',
    name: 'duration-set-time',
    validate: '/duration:string/user=user/key=string/value=number',
    middleware: [
      Middleware.hasRole(['keyholder', 'developer'])
    ],
    permissions: {
      restricted: true
    }
  }
)

export async function setDurationTime(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.v.o.user)
  const userAt = Utils.User.buildUserChatAt(routed.v.o.user, userArgType)
  const userQuery = Utils.User.buildUserQuery(routed.v.o.user, userArgType)
  const newTime = routed.v.o.value
  const key = routed.v.o.key
  // User min or max
  const isMinOrMax = routed.v.o.key === 'min' || routed.v.o.key === 'max'
  // Ensure its one of these 2 or throw error
  if (!isMinOrMax) {
    await routed.message.reply(
      `must be \`!duration @user#0000 min ${newTime}\` or \`!duration @user#0000 max ${newTime}\``)
    return false
  }

  // Get user's _id from the db
  const targetUser = await routed.bot.DB.get<TrackedChannel>('users', userQuery)

  // Ensure target user is setup & has a session
  if (!targetUser) {
    await routed.message.reply(
      `User: ${userAt} could not be found, make sure they've used the following: \`!register\``)
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
      `User: ${userAt} needs to create a session \`!session new lovense\` and must not have activated it!`)
    return false
  }

  // Update props
  const nsession = new DeviceSession(userSession)
  nsession.duration[key] = newTime

  // Update in db
  await routed.bot.DB.update('sessions', { _id: userSession._id }, nsession)

  // Process command
  await routed.message.reply(
    `:white_check_mark: Setting duration ${userAt} ${key} to: \`${newTime}\` minutes`)
  routed.bot.DEBUG_MSG_COMMAND.log(`!duration ${userAt} ${key} ${newTime}`)
  return true
}