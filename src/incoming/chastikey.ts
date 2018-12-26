import { Bot } from "..";
import { Message } from "discord.js";
import { validateArgs, verifyUserRefType, buildUserQuery, buildUserChatAt } from "../utils";
import { TrackedUser } from "../objects/user";

export async function setUsername(bot: Bot, msg: Message, args: Array<string>) {
  const v = validateArgs(args, [
    { name: 'command', type: 'string' },
    { name: 'action', type: 'string' },
    // ChastiKey username
    { name: 'username', type: 'string' }
  ])

  if (!v.valid) {
    bot.DEBUG_MSG_COMMAND(`!ck username ${v.o.username} -> validation check 'failed'`)
    await msg.reply(`:warning: Command error, must be formatted like: \`!ck username MyUsername\``)
    return;
  }

  const userArgType = verifyUserRefType(msg.author.id)
  const userQuery = buildUserQuery(msg.author.id, userArgType)

  const user = new TrackedUser(await bot.Users.get(userQuery))
  // Change/Update TrackedChastiKey.Username Prop
  user.ChastiKey.username = v.o.username
  // Commit change to db
  const updateResult = await bot.Users.update(userQuery, user)

  if (updateResult > 0) {
    // Process command
    await msg.author.send(`:white_check_mark: ChastiKey Username now set to: ${v.o.username}`)
    bot.DEBUG_MSG_COMMAND(`!ck username ${v.o.username}`)
  }
  else {
    bot.DEBUG_MSG_COMMAND(`!ck username ${v.o.username} -> update unsuccessful!`)
  }
}