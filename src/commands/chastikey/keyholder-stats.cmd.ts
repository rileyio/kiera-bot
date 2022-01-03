import * as Utils from '@/utils'

import { RoutedInteraction } from '@/router'
import { TrackedUser } from '@/objects/user/'
import { keyholderStats } from '@/commands/chastikey/keyholder-stats.embed'

export async function getStats(routed: RoutedInteraction) {
  // Check if username was specified from slash commands or from legacy command
  const username = routed.interaction.options.get('username')?.value as string

  // Get user from lockee data (Stats, User and Locks)
  const keyholderData = await routed.bot.Service.ChastiKey.fetchAPIKeyholderData({
    discordid: !username ? routed.author.id : undefined,
    username: username ? username : undefined
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (keyholderData.response.status !== 200) {
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
  if (keyholderData.data.displayInStats === 2) {
    await Utils.ChastiKey.statsDisabledError(routed)
    return true // Stop here
  }

  // Get user's current ChastiKey username from users collection or by the override
  const user = username
    ? new TrackedUser(
        await routed.bot.DB.get('users', {
          $or: [{ id: String(keyholderData.data.discordID) || 123 }, { 'ChastiKey.username': String(new RegExp(`^${keyholderData.data.username}$`, 'i')) }]
        })
      ) ||
      // Fallback: Create a mock record
      // TODO: Fix or just remove when CK is deprecated
      new TrackedUser(<any>{
        ChastiKey: {
          preferences: {
            keyholder: {
              showAverage: false
            }
          },
          ticker: {
            showStarRatingScore: true
          },
          username: keyholderData.data.username
        },
        __notStored: true
      })
    : new TrackedUser(await routed.bot.DB.get('users', { id: routed.author.id }))

  // If the requested user has never keyheld
  if (keyholderData.data.timestampFirstKeyheld === 0) {
    await routed.reply(routed.$render('ChastiKey.Stats.KeyholderNoLocks'))
    return false // stop here
  }

  // Get lockees under a KH
  const cachedRunningLocks = await routed.bot.DB.aggregate<{ _id: string; locks: Array<any>; count: number; uniqueCount: number }>('ck-running-locks', [
    {
      $match: { lockedBy: keyholderData.data.username }
    },
    {
      $group: {
        _id: '$username',
        count: { $sum: 1 },
        locks: {
          $push: {
            cumulative: { $toBool: '$cumulative' },
            fixed: { $toBool: '$fixed' },
            keyholder: '$lockedBy',
            lockFrozenByCard: { $toBool: '$lockFrozenByCard' },
            lockFrozenByKeyholder: { $toBool: '$lockFrozenByKeyholder' },
            noOfTurns: '$noOfTurns',
            secondsLocked: { $subtract: [Date.now() / 1000, '$timestampLocked'] },
            sharedLockName: '$lockName',
            timerHidden: { $toBool: '$timerHidden' }
          }
        },
        locksArrayByLockedTime: { $addToSet: '$timestampLocked' }
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        keyholders: 1,
        locks: 1,
        // eslint-disable-next-line sort-keys
        uniqueCount: { $cond: { if: { $isArray: '$locksArrayByLockedTime' }, then: { $size: '$locksArrayByLockedTime' }, else: 0 } }
      }
    },
    { $sort: { count: -1 } }
  ])

  // Set cached timestamp for running locks - this SHOULD be close or the same as the KH re-cached time
  const cachedTimestampFromFetch = await routed.bot.DB.get('scheduled-jobs', { name: 'ChastiKeyAPIRunningLocks' })
  const cachedTimestamp = Number(cachedTimestampFromFetch.lastFinishedAt)

  // Send stats
  await routed.reply({
    embeds: [
      keyholderStats(keyholderData.data, cachedRunningLocks, cachedTimestamp, routed.routerStats, {
        showAverage: user.ChastiKey.preferences.keyholder.showAverage,
        showRating: user.ChastiKey.ticker.showStarRatingScore
      })
    ]
  })

  // Successful end
  return true
}
