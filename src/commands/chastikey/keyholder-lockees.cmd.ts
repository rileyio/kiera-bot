import * as Utils from '@/utils'

import { RoutedInteraction } from '@/router'
import { TrackedKeyholderLockeesStatistics } from '@/commands/chastikey/shared'
import { keyholderLockees } from '@/commands/chastikey/keyholder-lockees.embed'

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
    return await routed.reply(routed.$render('ChastiKey.Error.UserLookupErrorOrNotFound'))
  }

  // If the user has display_in_stats === 2 then stop here
  if (keyholderData.data.displayInStats === 2) {
    return await Utils.ChastiKey.statsDisabledError(routed)
  }

  // Get lockees under a KH
  const activeLocks = await routed.bot.DB.aggregate<TrackedKeyholderLockeesStatistics>('ck-running-locks', [
    {
      $match: { lockedBy: keyholderData.data.username }
    },
    {
      $group: {
        _id: '$username',
        count: {
          $sum: 1
        },
        keyholders: {
          $addToSet: '$lockedBy'
        },
        locks: {
          $push: {
            fixed: {
              $toBool: '$fixed'
            },
            keyholder: '$lockedBy',
            lockFrozenByCard: {
              $toBool: '$lockFrozenByCard'
            },
            lockFrozenByKeyholder: {
              $toBool: '$lockFrozenByKeyholder'
            },
            timerHidden: {
              $toBool: '$timerHidden'
            }
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ])

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = await routed.bot.DB.get('scheduled-jobs', { name: 'ChastiKeyAPIRunningLocks' })
  const cachedTimestamp = Number(cachedTimestampFromFetch.lastFinishedAt)

  return await routed.reply({ embeds: [keyholderLockees(activeLocks, keyholderData.data.username, routed.routerStats, cachedTimestamp)] })
}
