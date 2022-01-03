import * as Utils from '@/utils'

import { RoutedInteraction } from '@/router'
import { TrackedUser } from '@/objects/user/'
import { lockeeStats } from '@/commands/chastikey/lockee-stats.embed'

export async function getStats(routed: RoutedInteraction) {
  // Check if username was specified from slash commands or from legacy command
  const username = routed.interaction.options.get('username')?.value as string

  // Get user from lockee data (Stats, User and Locks)
  const lockeeData = await routed.bot.Service.ChastiKey.fetchAPILockeeData({
    discordid: !username ? routed.author.id : undefined,
    showDeleted: true,
    username: username ? username : undefined
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (lockeeData.response.status !== 200) {
    if (username) {
      // Notify in chat what the issue could be for the target user
      await routed.reply(routed.$render('ChastiKey.Error.UserLookupErrorOrNotFound'))
    } else {
      // Notify in chat what the issue could be for the user's own account
      await routed.reply(routed.$render('ChastiKey.Error.SelfLookupErrorOrNotFound'))
    }
    return true // Stop here
  }

  // If the user has display_in_stats === 2 then stop here
  if (lockeeData.data.displayInStats === 2) {
    await Utils.ChastiKey.statsDisabledError(routed)
    return true // Stop here
  }

  // Get user's current ChastiKey username from users collection or by the override
  const kieraUser =
    username && lockeeData.data.discordID
      ? (await routed.bot.DB.get('users', { id: String(lockeeData.data.discordID) })) ||
        // Fallback: Create a mock record
        <TrackedUser>{ ChastiKey: { isVerified: false, ticker: { showStarRatingScore: true }, username: lockeeData.data.username } }
      : // Else when its the caller themself: Lookup the user by Discord ID
        routed.user

  // Generate compiled stats
  await routed.reply({ embeds: [lockeeStats(lockeeData, { showRating: kieraUser.ChastiKey.ticker.showStarRatingScore }, routed)] })

  return true
}
