import * as Middleware from '@/middleware'
import * as Utils from '@/utils'

import { ExportRoutes, RoutedInteraction, RouterRouted } from '@/router'

import { MessageAttachment } from 'discord.js'
import { TrackedUser } from '@/objects/user/'

// export const Routes = ExportRoutes(
//   {
//     category: 'ChastiKey',
//     controller: setTickerType,
//     description: 'Help.ChastiKey.SetTickerType.Description',
//     example: '{{prefix}}ck ticker set type 2',
//     middleware: [Middleware.isCKVerified],
//     name: 'ck-set-tickerType',
//     permissions: {
//       defaultEnabled: false,
//       serverOnly: false
//     },
//     type: 'message',
//     validate: '/ck:string/ticker:string/set:string/type:string/number=number'
//   },
//   {
//     category: 'ChastiKey',
//     controller: setTickerDate,
//     description: 'Help.ChastiKey.SetTickerDate.Description',
//     example: '{{prefix}}ck ticker set date 2019-01-27',
//     middleware: [Middleware.isCKVerified],
//     name: 'ck-set-tickerDate',
//     permissions: {
//       defaultEnabled: false,
//       serverOnly: false
//     },
//     type: 'message',
//     validate: '/ck:string/ticker:string/set:string/date:string/number=string'
//   },
//   {
//     category: 'ChastiKey',
//     controller: setTickerRatingDisplay,
//     description: 'Help.ChastiKey.ToggleTickerRating.Description',
//     example: '{{prefix}}ck ticker set rating show',
//     middleware: [Middleware.isCKVerified],
//     name: 'ck-set-ratingDisplay',
//     permissions: {
//       defaultEnabled: false,
//       serverOnly: false
//     },
//     type: 'message',
//     validate: '/ck:string/ticker:string/set:string/rating:string/state=string'
//   },
//   {
//     category: 'ChastiKey',
//     controller: getTicker,
//     description: 'Help.ChastiKey.Ticker.Description',
//     example: '{{prefix}}ck ticker',
//     middleware: [Middleware.isCKVerified],
//     name: 'ck-get-ticker',
//     permissions: {
//       defaultEnabled: false,
//       serverOnly: false
//     },
//     type: 'message',
//     validate: '/ck:string/ticker:string/typeOrUser?=string/type?=number/date?=string',
//     validateAlias: ['/ck:string/t:string/typeOrUser?=string/type?=number/date?=string']
//   }
// )

// /**
//  * Sets user's Ticker Type
//  *
//  * Defaults to: `2` Lockee
//  *
//  * @export
//  * @param {RouterRouted} routed
//  */
// export async function setTickerType(routed: RouterRouted) {
//   let newTickerType: number
//   let newTickerTypeAsString: string

//   switch (routed.v.o.number) {
//     case 1:
//       newTickerType = 1
//       newTickerTypeAsString = 'Keyholder'
//       break
//     case 2:
//       newTickerType = 2
//       newTickerTypeAsString = 'Lockee'
//       break
//     case 3:
//       newTickerType = 3
//       newTickerTypeAsString = 'Both'
//       break

//     default:
//       // Invalid number, stop the routing
//       return false
//   }

//   // Get the user from the db in their current state
//   const user = new TrackedUser(await routed.bot.DB.get('users', { id: routed.author.id }))
//   // Change/Update TrackedChastiKey.Type Prop
//   user.ChastiKey.ticker.type = newTickerType
//   // Commit change to db
//   const updateResult = await routed.bot.DB.update('users', { id: routed.author.id }, user)

//   if (updateResult > 0) {
//     await routed.message.reply(`:white_check_mark: ChastiKey Ticker type now set to: \`${newTickerTypeAsString}\``)
//     routed.bot.Log.Command.log(`{{prefix}}ck ticker set type ${newTickerTypeAsString}`)
//     return true
//   } else {
//     routed.bot.Log.Command.log(`{{prefix}}ck ticker set type ${newTickerTypeAsString} -> update unsuccessful!`)
//     return false
//   }
// }

// export async function setTickerDate(routed: RouterRouted) {
//   // Validate ticker date passed
//   if (/([0-9]{4}-[0-9]{2}-[0-9]{2})/.test(routed.v.o.number)) {
//     await routed.bot.DB.update('users', { id: routed.author.id }, { $set: { 'ChastiKey.ticker.date': routed.v.o.number } }, { atomic: true })

//     await routed.message.reply(`:white_check_mark: ChastiKey Start Date now set to: \`${routed.v.o.number}\``)
//     routed.bot.Log.Command.log(`{{prefix}}ck ticker set date ${routed.v.o.number}`)

//     return true
//   } else {
//     await routed.message.reply(`Failed to set ChastiKey Start Date format must be like: \`2019-01-26\``)
//     routed.bot.Log.Command.log(`{{prefix}}ck ticker set date ${routed.v.o.number}`)

//     return true
//   }
// }

// export async function setTickerRatingDisplay(routed: RouterRouted) {
//   // True or False sent
//   if (routed.v.o.state.toLowerCase() === 'show' || routed.v.o.state.toLowerCase() === 'hide') {
//     await routed.bot.DB.update(
//       'users',
//       { id: routed.author.id },
//       { $set: { 'ChastiKey.ticker.showStarRatingScore': `show` ? routed.v.o.state === 'show' : false } },
//       { atomic: true }
//     )

//     await routed.message.reply(`:white_check_mark: ChastiKey Rating Display now ${routed.v.o.state === 'show' ? '`shown`' : '`hidden`'}`)
//     routed.bot.Log.Command.log(`{{prefix}}ck ticker set rating ${routed.v.o.state}`)

//     return true
//   } else {
//     await routed.message.reply(`Failed to set ChastiKey Rating Display, format must be like: \`show\``)
//     routed.bot.Log.Command.log(`{{prefix}}ck ticker set rating ${routed.v.o.state}`)

//     return true
//   }
// }

export async function getTicker(routed: RoutedInteraction) {
  const username = routed.interaction.options.get('username')?.value as string
  const date = routed.interaction.options.get('date')?.value as string
  const type = routed.interaction.options.get('type')?.value as 'both' | 'lockee' | 'keyholder'

  const user = new TrackedUser(
    username ? await routed.bot.DB.get('users', { 'ChastiKey.username': new RegExp(`^${username}$`, 'i') }) : await routed.bot.DB.get('users', { id: routed.author.id })
  )

  // If the user has passed a type as an argument, use that over what was saved as their default
  if (type) {
    switch (type) {
      case 'keyholder':
        user.ChastiKey.ticker.type = 1
        break
      case 'lockee':
        user.ChastiKey.ticker.type = 2
        break
      case 'both':
        user.ChastiKey.ticker.type = 3
        break
    }
  }

  // Override stored username on user with ckUser one if one is not passed
  user.ChastiKey.username = String(username ? username : user.ChastiKey.username)

  // Override stored date if one is passed
  if (date) user.ChastiKey.ticker.date = String(date)

  // If the type is only for a single ticker, return just that
  routed.bot.Log.Command.log(Utils.ChastiKey.generateTickerURL(user.ChastiKey))
  if (user.ChastiKey.ticker.type === 1 || user.ChastiKey.ticker.type === 2)
    return await routed.reply({
      content: routed.$render('ChastiKey.Ticker.IncorrectTimer', { startDate: user.ChastiKey.ticker.date || false, wasDateOverridden: !!date }),
      files: [new MessageAttachment(Utils.ChastiKey.generateTickerURL(user.ChastiKey), `${Date.now()}-ticker.png`)]
    })
  else
    return await routed.reply({
      content: routed.$render('ChastiKey.Ticker.IncorrectTimer', { startDate: user.ChastiKey.ticker.date || false, wasDateOverridden: !!date }),
      files: [
        new MessageAttachment(Utils.ChastiKey.generateTickerURL(user.ChastiKey, 1), `${Date.now()}-ticker-lockee.png`),
        new MessageAttachment(Utils.ChastiKey.generateTickerURL(user.ChastiKey, 2), `${Date.now()}-ticker-keyholder.png`)
      ]
    })
}
