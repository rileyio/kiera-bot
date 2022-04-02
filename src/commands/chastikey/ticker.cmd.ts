import * as Middleware from '@/middleware'
import * as Utils from '@/utils'

import { ExportRoutes, RoutedInteraction, RouterRouted } from '@/router'

import { MessageAttachment } from 'discord.js'
import { TrackedUser } from '@/objects/user/'

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
