import * as Utils from '@/utils'

import { TrackedKeyholderLockeesStatistics, TrackedSharedKeyholderStatistics } from '@/embedded/chastikey-stats'
import { keyholderLockees, keyholderStats, lockeeStats, sharedKeyholdersStats } from '@/embedded/chastikey-stats'

import { RoutedInteraction } from '@/router'
import { TrackedUser } from '@/objects/user/'

export async function getLockeeStats(routed: RoutedInteraction) {
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

export async function getKeyholderStats(routed: RoutedInteraction) {
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

export async function getCheckLockeeMultiLocked(routed: RoutedInteraction) {
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
    await routed.reply(routed.$render('ChastiKey.Error.UserNotFound'))
    return true // Stop here
  }

  // If the user has display_in_stats === 2 then stop here
  if (keyholderData.data.displayInStats === 2) {
    await Utils.ChastiKey.statsDisabledError(routed)
    return true // Stop here
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

  await routed.reply({ embeds: [sharedKeyholdersStats(activeLocks, keyholderData.data.username, routed.routerStats, cachedTimestamp)] })

  // Successful end
  return true
}

export async function getKeyholderLockees(routed: RoutedInteraction) {
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
    await routed.reply(routed.$render('ChastiKey.Error.UserLookupErrorOrNotFound'))
    return true // Stop here
  }

  // If the user has display_in_stats === 2 then stop here
  if (keyholderData.data.displayInStats === 2) {
    await Utils.ChastiKey.statsDisabledError(routed)
    return true // Stop here
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

  await routed.reply({ embeds: [keyholderLockees(activeLocks, keyholderData.data.username, routed.routerStats, cachedTimestamp)] })

  // Successful end
  return true
}
