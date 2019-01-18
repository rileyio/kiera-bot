import * as Utils from '../utils';
import { RouterRouted } from '../utils/router';
import { DeviceSession } from '../objects/sessions';

export namespace Limit {
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
    const targetUser = await routed.bot.Users.get(userQuery)

    // Ensure user is setup & has a session
    if (!targetUser) {
      await routed.message.reply(
        `Make sure you've used the following: \`!register\``)
      return false
    }

    const userSession = await routed.bot.Sessions.get({
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
    await routed.bot.Sessions.update({ _id: userSession._id }, nsession)

    // Process command
    const timeOrIntensityStr = key === 'time' ? 'minutes' : '%'
    await routed.message.reply(`:white_check_mark: Setting your ${key} limit to: \`${newValue}\` ${timeOrIntensityStr}`)
    routed.bot.DEBUG_MSG_COMMAND.log(`!limit time ${newValue}`)
    return true
  }
}