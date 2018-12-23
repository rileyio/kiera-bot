import { Bot } from "..";
import { Message } from "discord.js";
import { validateArgs } from "../utils";
import { TrackedUser } from "../user";

export async function registerUser(bot: Bot, msg: Message, args: Array<string>) {
  const v = validateArgs(args, [
    { name: 'command', type: 'string' }
  ])

  if (!v.valid) {
    bot.DEBUG_MSG_COMMAND(`!register ${msg.author.id}`)
    await msg.channel.send(`:warning: Command error`)
    return;
  }

  var isRegistered = await bot.DB_Users.verify(msg.author.id)
  if (!isRegistered) {
    // If not yet registered, store user in db
    var dbUser = await bot.DB_Users.add(new TrackedUser({
      id: msg.author.id,
      username: msg.author.username,
      createdTimestamp: msg.author.createdTimestamp
    }))
    // Update registered if successfully stored
    isRegistered = true

    await msg.channel.send(`:white_check_mark: You're now registered! ^_^`)
    bot.DEBUG_MSG_COMMAND(`!register ${msg.author.id}`)
  }
  else {
    await msg.channel.send(`You're already registered! :wink:`)
    bot.DEBUG_MSG_COMMAND(`!register ${msg.author.id} - user already registered`)
  }
}