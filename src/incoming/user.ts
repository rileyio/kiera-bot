import { Bot } from "..";
import { Message } from "discord.js";
import { validateArgs, buildUserChatAt, verifyUserRefType } from "../utils";
import { TrackedUser } from "../objects/user";

export async function registerUser(bot: Bot, msg: Message, args: Array<string>) {
  const v = validateArgs(args, [
    { name: 'command', type: 'string' }
  ])

  if (!v.valid) {
    bot.DEBUG_MSG_COMMAND(`!register ${msg.author.id}`)
    await msg.reply(`:warning: Command error`)
    return;
  }

  const userArgType = verifyUserRefType(msg.author.id)
  const isRegistered = await bot.Users.verify(msg.author.id)

  if (!isRegistered) {
    // If not yet registered, store user in db
    var user = await bot.Users.add(new TrackedUser({
      id: msg.author.id,
      username: msg.author.username,
      discriminator: msg.author.discriminator,
      createdTimestamp: msg.author.createdTimestamp,
    }))

    await msg.reply(`:white_check_mark: ${buildUserChatAt(user, userArgType)}, You're now registered! ^_^`)
    bot.DEBUG_MSG_COMMAND(`!register ${buildUserChatAt(user, userArgType)}`)
  }
  else {
    await msg.reply(`You're already registered! :wink:`)
    bot.DEBUG_MSG_COMMAND(`!register ${buildUserChatAt(msg.author.id, userArgType)} - user already registered`)
  }
}