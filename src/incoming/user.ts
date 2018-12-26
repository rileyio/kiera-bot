import { buildUserChatAt, verifyUserRefType } from "../utils";
import { TrackedUser } from "../objects/user";
import { RouterRouted } from "../utils/router";

export async function registerUser(routed: RouterRouted) {
  const userArgType = verifyUserRefType(routed.message.author.id)
  const isRegistered = await routed.bot.Users.verify(routed.message.author.id)

  if (!isRegistered) {
    // If not yet registered, store user in db
    var user = await routed.bot.Users.add(new TrackedUser({
      id: routed.message.author.id,
      username: routed.message.author.username,
      discriminator: routed.message.author.discriminator,
      createdTimestamp: routed.message.author.createdTimestamp,
    }))

    await routed.message.reply(`:white_check_mark: ${buildUserChatAt(user, userArgType)}, You're now registered! ^_^`)
    routed.bot.DEBUG_MSG_COMMAND(`!register ${buildUserChatAt(user, userArgType)}`)
  }
  else {
    await routed.message.reply(`You're already registered! :wink:`)
    routed.bot.DEBUG_MSG_COMMAND(`!register ${buildUserChatAt(routed.message.author.id, userArgType)} - user already registered`)
  }
}