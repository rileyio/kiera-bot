import { Bot } from "..";
import { Message, Attachment } from "discord.js";
import { validateArgs, verifyUserRefType, buildUserQuery, buildUserChatAt } from "../utils";
import { TrackedUser } from "../objects/user";
import { generateTickerURL } from "../utils/chastikey";
import { ChastiKeyTickerType } from "../objects/chastikey";

export async function setUsername(bot: Bot, msg: Message, args: Array<string>) {
  const v = validateArgs(args, [
    { name: 'command', type: 'string' },
    { name: 'subroute', type: 'string' },
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

  // Get the user from the db in their current state
  const user = new TrackedUser(await bot.Users.get(userQuery))
  // Change/Update TrackedChastiKey.Username Prop
  user.ChastiKey.username = v.o.username
  // Commit change to db
  const updateResult = await bot.Users.update(userQuery, user)

  if (updateResult > 0) {
    await msg.author.send(`:white_check_mark: ChastiKey Username now set to: ${v.o.username}`)
    bot.DEBUG_MSG_COMMAND(`!ck username ${v.o.username}`)
  }
  else {
    bot.DEBUG_MSG_COMMAND(`!ck username ${v.o.username} -> update unsuccessful!`)
  }
}

export async function setTickerType(bot: Bot, msg: Message, args: Array<string>) {
  const v = validateArgs(args, [
    { name: 'command', type: 'string' },
    { name: 'subroute', type: 'string' },
    { name: 'action', type: 'string' },
    { name: 'action2', type: 'string' },
    { name: 'type', type: 'number' }
  ])

  if (!v.valid) {
    bot.DEBUG_MSG_COMMAND(`!ck username ${v.o.username} -> validation check 'failed'`)
    await msg.reply(`:warning: Command error, must be formatted like: \`!ck username MyUsername\``)
    return;
  }

  const userArgType = verifyUserRefType(msg.author.id)
  const userQuery = buildUserQuery(msg.author.id, userArgType)
  const newTickerType = v.o.type === 1 || v.o.type === 2 ?
    v.o.type === 1
      ? ChastiKeyTickerType.Keyholder
      : ChastiKeyTickerType.Lockee
    : ChastiKeyTickerType.Lockee // Fallback default = lockee

  const newTickerTypeAsString = newTickerType === ChastiKeyTickerType.Keyholder
    ? 'Keyholder'
    : 'Lockee'

  // Get the user from the db in their current state
  const user = new TrackedUser(await bot.Users.get(userQuery))
  // Change/Update TrackedChastiKey.Type Prop
  user.ChastiKey.ticker.type = newTickerType
  // Commit change to db
  const updateResult = await bot.Users.update(userQuery, user)

  if (updateResult > 0) {
    await msg.author.send(`:white_check_mark: ChastiKey Ticker type now set to: ${newTickerTypeAsString}`)
    bot.DEBUG_MSG_COMMAND(`!ck ticker set type ${newTickerTypeAsString}`)
  }
  else {
    bot.DEBUG_MSG_COMMAND(`!ck ticker set type ${newTickerTypeAsString} -> update unsuccessful!`)
  }
}

export async function getTicker(bot: Bot, msg: Message, args: Array<string>) {
  const v = validateArgs(args, [
    { name: 'command', type: 'string' },
    { name: 'subroute', type: 'string' },
    // ChastiKey username
    { name: 'username', type: 'string', required: false }
  ])

  if (!v.valid) {
    bot.DEBUG_MSG_COMMAND(`!ck ticker -> validation check 'failed'`)
    await msg.reply(`:warning: Command error, must be formatted like: \`!ck ticker\``)
    return;
  }

  const userArgType = verifyUserRefType(msg.author.id)
  const userQuery = buildUserQuery(msg.author.id, userArgType)
  const user = new TrackedUser(await bot.Users.get(userQuery))
  const attachment = new Attachment(generateTickerURL(user.ChastiKey));
  await msg.channel.send(attachment);
}