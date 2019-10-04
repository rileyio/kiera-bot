import * as Middleware from '../../middleware';
import * as Utils from '../../utils/';
import { RouterRouted } from '../../router/router';
import { Attachment } from 'discord.js';
import { TrackedUser } from '../../objects/user';
import { ExportRoutes } from '../../router/routes-exporter';
import { TrackedChastiKeyUser } from '../../objects/chastikey';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: setTickerType,
    example: '{{prefix}}ck ticker set type 2',
    name: 'ck-set-tickerType',
    validate: '/ck:string/ticker:string/set:string/type:string/number=number',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: setTickerDate,
    example: '{{prefix}}ck ticker set date 2019-01-27',
    name: 'ck-set-tickerDate',
    validate: '/ck:string/ticker:string/set:string/date:string/number=string',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: setTickerRatingDisplay,
    example: '{{prefix}}ck ticker set rating show',
    name: 'ck-set-ratingDisplay',
    validate: '/ck:string/ticker:string/set:string/rating:string/state=string',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getTicker,
    example: '{{prefix}}ck ticker',
    name: 'ck-get-ticker',
    validate: '/ck:string/ticker:string/type?=number',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  }
)
/**
 * Sets user's Ticker Type
 * 
 * Defaults to: `2` Lockee
 * 
 * @export
 * @param {RouterRouted} routed
 */
export async function setTickerType(routed: RouterRouted) {
  const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { discordID: Number(routed.user.id) }))

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
  const user = new TrackedUser(await routed.bot.DB.get('users', { id: String(ckUser.discordID) }))
  // Change/Update TrackedChastiKey.Type Prop
  user.ChastiKey.ticker.type = newTickerType
  // Commit change to db
  const updateResult = await routed.bot.DB.update('users', { id: String(ckUser.discordID) }, user)

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

export async function setTickerDate(routed: RouterRouted) {
  const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { discordID: Number(routed.user.id) }))

  // Validate ticker date passed
  if (/([0-9]{4}-[0-9]{2}-[0-9]{2})/.test(routed.v.o.number)) {
    await routed.bot.DB.update('users', { id: String(ckUser.discordID) }, { $set: { 'ChastiKey.ticker.date': routed.v.o.number } }, { atomic: true })

    await routed.message.author.send(`:white_check_mark: ChastiKey Start Date now set to: \`${routed.v.o.number}\``)
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck ticker set date ${routed.v.o.number}`)

    return true
  }
  else {
    await routed.message.author.send(`Failed to set ChastiKey Start Date format must be like: \`2019-01-26\``)
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck ticker set date ${routed.v.o.number}`)

    return true
  }
}

export async function setTickerRatingDisplay(routed: RouterRouted) {
  const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { discordID: Number(routed.user.id) }))

  // True or False sent
  if (routed.v.o.state.toLowerCase() === 'show' || routed.v.o.state.toLowerCase() === 'hide') {
    await routed.bot.DB.update('users', { id: String(ckUser.discordID) },
      { $set: { 'ChastiKey.ticker.showStarRatingScore': `show` ? routed.v.o.state === 'show' : false } },
      { atomic: true })

    await routed.message.reply(`:white_check_mark: ChastiKey Rating Display now ${routed.v.o.state === 'show' ? '`shown`' : '`hidden`'}`)
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck ticker set rating ${routed.v.o.state}`)

    return true
  }
  else {
    await routed.message.reply(`Failed to set ChastiKey Rating Display, format must be like: \`show\``)
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck ticker set rating ${routed.v.o.state}`)

    return true
  }
}

export async function getTicker(routed: RouterRouted) {
  const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { discordID: Number(routed.user.id) }))
  const user = await routed.bot.DB.get<TrackedUser>('users', { id: String(ckUser.discordID) })
    // Fallback: Create a mock record
    || (<TrackedUser>{ __notStored: true, ChastiKey: { username: String(ckUser.username), ticker: { showStarRatingScore: true, type: 2 } } })

  // If the user has passed a type as an argument, use that over what was saved as their default
  if (routed.v.o.type !== undefined) {
    // Stop invalid number/inputs
    // if (routed.v.o.type !== 1 || routed.v.o.type !== 2 || routed.v.o.type !== 3) {
    //   await routed.message.channel.send(Utils.sb(Utils.en.chastikey.invalidOverrideType))
    //   return false
    // }
    user.ChastiKey.ticker.type = routed.v.o.type
  }

  // Override stored username on user with ckUser one
  user.ChastiKey.username = String(ckUser.username)

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