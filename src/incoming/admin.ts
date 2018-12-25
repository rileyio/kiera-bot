import { Bot } from "..";
import { Message, Channel } from "discord.js";
import { validateArgs, verifyUserRefType, UserRefType, buildUserQuery, buildUserFull, buildUserWrappedSnowflake, buildUserChatAt } from "../utils";

export async function adminRemoveUser(bot: Bot, msg: Message, args: Array<string>) {
  const v = validateArgs(args, [
    { name: 'command', type: 'string' },
    { name: 'action', type: 'string' },
    { name: 'modifier', type: 'string' },
    { name: 'user', type: 'user' }
  ])

  if (!v.valid) {
    bot.DEBUG_MSG_COMMAND(`!admin user delete ${v.o.user} -> validation check 'failed'`)
    await msg.reply(`:warning: Command error, must be formatted like: \`!admin user delete @user#0000\``)
    return;
  }

  const userArgType = verifyUserRefType(v.o.user)
  const userQuery = buildUserQuery(v.o.user, userArgType)

  const user = await bot.Users.get(userQuery)
  const removed = await bot.Users.remove(userQuery)

  if (removed === 0) return; // Stop here if nothing is removed
  // Process command
  await msg.reply(`:white_check_mark: Removing user ${buildUserChatAt(user, userArgType)} from db`)
  bot.DEBUG_MSG_COMMAND(`!admin user delete ${buildUserChatAt(user, userArgType)}`)
}