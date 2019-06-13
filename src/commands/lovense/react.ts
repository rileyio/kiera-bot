import * as Middleware from '../../middleware';
import * as Utils from '../../utils';
import { RouterRouted } from '../../router/router';
import { DeviceSession } from '../../objects/sessions';
import { TrackedUser } from '../../objects/user';
import { ExportRoutes } from '../../router/routes-exporter';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Integration',
    commandTarget: 'argument',
    controller: setReactTime,
    example: '{{prefix}}react',
    name: 'react-set-time',
    validate: '/react:string/user=user/time:string/newtime=number',
    middleware: [
      Middleware.middlewareTest,
      Middleware.hasRole(['developer', 'keyholder'])
    ],
    permissions: {
      restricted: true
    }
  },
)

export async function setReactTime(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.v.o.user)
  const userAt = Utils.User.buildUserChatAt(routed.v.o.user, userArgType)
  const userQuery = Utils.User.buildUserQuery(routed.v.o.user, userArgType)
  const newTime = routed.v.o.newtime
  const targetUser = await routed.bot.DB.get<TrackedUser>('users', userQuery)

  // Ensure target user is setup & has a session
  if (!targetUser) {
    await routed.message.reply(
      `User: ${userAt} could not be found, make sure they've used the following: \`!register\``)
    return false;
  }

  const userSession = await routed.bot.DB.get<DeviceSession>('sessions', {
    uid: targetUser._id,
    isActive: false,
    isDeactivated: false,
    isCompleted: false,
  })

  // Ensure session exists
  if (!userSession) {
    await routed.message.reply(
      `User: ${userAt} needs to create a session \`!session new lovense\` and must not have activated it!`)
    return false;
  }

  // Update props
  const nsession = new DeviceSession(userSession)
  nsession.react.time = newTime

  // Update in db
  await routed.bot.DB.update('sessions', { _id: userSession._id }, nsession)

  await routed.message.channel.send(
    `:white_check_mark: Setting react time for ${userAt} to: \`${newTime}\` minutes`)
  routed.bot.DEBUG_MSG_COMMAND.log(`!react ${userAt} time ${newTime}`)
  return true
}