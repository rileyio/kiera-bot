import * as Utils from '@/utils'

import { RoutedInteraction } from '@/router'
import { TrackedUser } from '@/objects/user/'
import { embed } from '@/commands/chastikey/lockee-history.embed'

export async function history(routed: RoutedInteraction) {
  const username = routed.interaction.options.get('username')?.value as string

  // Get any Kiera preferences
  const kieraUser = new TrackedUser((await routed.bot.DB.get('users', username ? { 'ChastiKey.username': username } : { id: routed.author.id })) || { __notStored: true })

  // Get user from lockee data (Stats, User and Locks)
  const lockeeData = await routed.bot.Service.ChastiKey.fetchAPILockeeData({
    discordid: !username ? routed.author.id : kieraUser.__notStored ? undefined : kieraUser.ChastiKey.username.toLowerCase() === username.toLowerCase() ? kieraUser.id : undefined,
    showDeleted: true,
    username: kieraUser.__notStored && username ? username : undefined
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (lockeeData.response.status !== 200) {
    if (username) {
      // Notify in chat what the issue could be for the target user
      return await routed.reply(routed.$render('ChastiKey.Error.UserLookupErrorOrNotFound'))
    } else {
      // Notify in chat what the issue could be for the user's own account
      return await routed.reply(routed.$render('ChastiKey.Error.SelfLookupErrorOrNotFound'))
    }
  }

  // If the user has display_in_stats === 2 then stop here
  if (lockeeData.data.displayInStats === 2) return await Utils.ChastiKey.statsDisabledError(routed)

  return await routed.reply({
    embeds: [embed(lockeeData, { showRating: !kieraUser.__notStored ? kieraUser.ChastiKey.ticker.showStarRatingScore : true }, routed.routerStats)]
  })
}
