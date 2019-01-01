import * as Utils from '../utils';
import { TrackedUser } from '../objects/user';
import { RouterRouted } from '../utils/router';

export namespace User {
  export async function registerUser(routed: RouterRouted) {
    const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
    const isRegistered = await routed.bot.Users.verify(routed.message.author.id)

    if (!isRegistered) {
      // If not yet registered, store user in db
      const userID = await routed.bot.Users.add(new TrackedUser({
        id: routed.message.author.id,
        username: routed.message.author.username,
        discriminator: routed.message.author.discriminator,
        createdTimestamp: routed.message.author.createdTimestamp,
      }))
      const user = await routed.bot.Users.get({ _id: userID })
      const userAt = Utils.User.buildUserChatAt(user, userArgType)

      await routed.message.reply(`:white_check_mark: ${userAt}, You're now registered! ^_^`)
      routed.bot.DEBUG_MSG_COMMAND(`!register ${userAt}`)
    }
    else {
      await routed.message.reply(`You're already registered! :wink:`)
      const userAt = Utils.User.buildUserChatAt(routed.message.author.id, userArgType)
      routed.bot.DEBUG_MSG_COMMAND(`!register ${userAt} - user already registered`)
    }
  }
}