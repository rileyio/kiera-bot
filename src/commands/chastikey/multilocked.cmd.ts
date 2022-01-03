import * as Utils from '@/utils'

import { RoutedInteraction } from '@/router'
import { TrackedSharedKeyholderStatistics } from '@/commands/chastikey/shared'
import { embed } from '@/commands/chastikey/multilocked.embed'

export async function getStats(routed: RoutedInteraction) {
  // Check if username was specified from slash commands or from legacy command
  const username = routed.interaction.options.get('username')?.value as string

  // Get user from lockee data (Stats, User and Locks)
  const keyholderData = await routed.bot.Service.ChastiKey.fetchAPIKeyholderData({
    discordid: username ? undefined : routed.author.id,
    username: username ? username : undefined
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (keyholderData.response.status !== 200) {
    // Notify in chat what the issue could be
    return await routed.reply(routed.$render('ChastiKey.Error.UserNotFound'))
  }

  // If the user has display_in_stats === 2 then stop here
  if (keyholderData.data.displayInStats === 2) {
    return await Utils.ChastiKey.statsDisabledError(routed)
  }

  // Get multiple KH locks from db
  const activeLocks = await routed.bot.DB.aggregate<TrackedSharedKeyholderStatistics>('ck-running-locks', [
    {
      $match: { lockedBy: { $ne: null } }
    },
    {
      $group: {
        _id: '$username',
        count: { $sum: 1 },
        keyholders: {
          $addToSet: '$lockedBy'
        }
      }
    },
    {
      $project: {
        count: 1,
        keyholders: 1,
        // eslint-disable-next-line sort-keys
        uniqueKHCount: { $cond: { if: { $isArray: '$keyholders' }, then: { $size: '$keyholders' }, else: 0 } }
      }
    },
    { $match: { count: { $gt: 1 }, keyholders: { $in: [keyholderData.data.username] }, uniqueKHCount: { $gt: 1 } } },
    { $sort: { count: -1 } }
  ])

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = await routed.bot.DB.get('scheduled-jobs', { name: 'ChastiKeyAPIRunningLocks' })
  const cachedTimestamp = Number(cachedTimestampFromFetch.lastFinishedAt)

  return await routed.reply({ embeds: [embed(activeLocks, keyholderData.data.username, routed.routerStats, cachedTimestamp)] })
}
