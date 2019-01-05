import * as Utils from '../utils';
import { RouterRouted } from '../utils/router';
import { DeviceSession } from '../objects/sessions';

export namespace React {
  export async function setReactTime(routed: RouterRouted) {
    const userArgType = Utils.User.verifyUserRefType(routed.v.o.user)
    const userAt = Utils.User.buildUserChatAt(routed.v.o.user, userArgType)
    const userQuery = Utils.User.buildUserQuery(routed.v.o.user, userArgType)
    const newTime = routed.v.o.newtime
    const targetUser = await routed.bot.Users.get(userQuery)

    // Ensure target user is setup & has a session
    if (!targetUser) return await routed.message.reply(
      `User: ${userAt} could not be found, make sure they've used the following: \`!register\``)

    const userSession = await routed.bot.Sessions.get({
      uid: targetUser._id,
      isActive: false,
      isDeactivated: false,
      isCompleted: false,
    })

    // Ensure session exists
    if (!userSession) return await routed.message.reply(
      `User: ${userAt} needs to create a session \`!session new lovense\` and must not have activated it!`)

    // Update props
    const nsession = new DeviceSession(userSession)
    nsession.react.time = newTime

    // Update in db
    await routed.bot.Sessions.update({ _id: userSession._id }, nsession)

    await routed.message.channel.send(
      `:white_check_mark: Setting react time for ${userAt} to: \`${newTime}\` minutes`)
    routed.bot.DEBUG_MSG_COMMAND.log(`!react ${userAt} time ${newTime}`)
  }
}