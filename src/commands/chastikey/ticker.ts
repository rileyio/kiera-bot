import * as Utils from '../../utils/';
import { RouterRouted } from '../../router/router';
import { Attachment } from 'discord.js';
import { ChastiKeyTickerType } from '../../objects/chastikey';
import { TrackedUser } from '../../objects/user';

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
  var newTickerType: number
  var newTickerTypeAsString: string

  switch (routed.v.o.number) {
    case 1:
      newTickerType = 1
      newTickerTypeAsString = 'Keyholder'
      break;
    case 2:
      newTickerType = 2
      newTickerTypeAsString = 'Lockee'
      break;
    case 3:
      newTickerType = 3
      newTickerTypeAsString = 'Both'
      break;

    default:
      // Invalid number, stop the routing
      return false
  }

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
    return true
  }
  else {
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck ticker set type ${newTickerTypeAsString} -> update unsuccessful!`)
    return false
  }
}

export async function getTicker(routed: RouterRouted) {
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)
  var user = new TrackedUser(await routed.bot.Users.get(userQuery))
  // If user is not in the DB, inform them they must register
  if (!user) {
    await routed.message.reply(Utils.sb(Utils.en.error.userNotRegistered))
    return false; // Stop here
  }

  // If the user has not configured their ChastiKey username to the bot
  if (user.ChastiKey.username === '') {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.usernameNotSet))
    return false; // Stop here
  }

  // If the user has passed a type as an argument, use that over what was saved as their default
  if (routed.v.o.type !== undefined) {
    // Stop invalid number/inputs
    // if (routed.v.o.type !== 1 || routed.v.o.type !== 2 || routed.v.o.type !== 3) {
    //   await routed.message.channel.send(Utils.sb(Utils.en.chastikey.invalidOverrideType))
    //   return false
    // }
    user.ChastiKey.ticker.type = routed.v.o.type
  }

  // If the type is only for a single ticker, return just that
  if (user.ChastiKey.ticker.type === 1 || user.ChastiKey.ticker.type === 2) {
    await routed.message.channel.send(Utils.sb(Utils.en.chastikey.incorrectTickerTimer), {
      files: [new Attachment(Utils.ChastiKey.generateTickerURL(user.ChastiKey))]
    })
    return true
  }
  else {
    await routed.message.channel.send(Utils.sb(Utils.en.chastikey.incorrectTickerTimer), {
      files: [
        Utils.ChastiKey.generateTickerURL(user.ChastiKey, 1),
        Utils.ChastiKey.generateTickerURL(user.ChastiKey, 2)
      ]
    })
    return true
  }
}