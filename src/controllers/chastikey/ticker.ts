import * as Utils from '../../utils';
import { RouterRouted } from '../../utils/router';
import { TextChannel, Attachment } from 'discord.js';
import { ChastiKeyTickerType } from '../../objects/chastikey';
import { TrackedUser } from '../../objects/user';
import { sb, en } from '../../string-builder';

/**
 * Sets user's Ticker Type
 * 
 * Defaults to: `2` Lockee
 * 
 * @export
 * @param {RouterRouted} routed
 */
export async function setTickerType(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)
  const newTickerType = routed.v.o.number === 1 || routed.v.o.number === 2 ?
    routed.v.o.number === 1
      ? ChastiKeyTickerType.Keyholder
      : ChastiKeyTickerType.Lockee
    : ChastiKeyTickerType.Lockee // Fallback default = lockee

  const newTickerTypeAsString = newTickerType === ChastiKeyTickerType.Keyholder
    ? 'Keyholder'
    : 'Lockee'

  // Get the user from the db in their current state
  const user = new TrackedUser(await routed.bot.Users.get(userQuery))
  // Change/Update TrackedChastiKey.Type Prop
  user.ChastiKey.ticker.type = newTickerType
  // Commit change to db
  const updateResult = await routed.bot.Users.update(userQuery, user)

  if (updateResult > 0) {
    await routed.message.author
      .send(`:white_check_mark: ChastiKey Ticker type now set to: \`${newTickerTypeAsString}\``)
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck ticker set type ${newTickerTypeAsString}`)
  }
  else {
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck ticker set type ${newTickerTypeAsString} -> update unsuccessful!`)
  }
}

export async function getTicker(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)
  const user = new TrackedUser(await routed.bot.Users.get(userQuery))
  // If user is not in the DB, inform them they must register
  if (!user) {
    await routed.message.reply(sb(en.error.userNotRegistered))
    return false; // Stop here
  }

  // If the user has not configured their ChastiKey username to the bot
  if (user.ChastiKey.username === '') {
    await routed.message.reply(sb(en.chastikey.usernameNotSet))
    return false; // Stop here
  }

  await routed.message.channel.send(new Attachment(Utils.ChastiKey.generateTickerURL(user.ChastiKey)))
  return true
}