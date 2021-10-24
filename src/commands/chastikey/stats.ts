import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { SlashCommandBuilder } from '@discordjs/builders'
import { RouterRouted, ExportRoutes } from '@/router'
import { lockeeStats, keyholderStats, sharedKeyholdersStats, keyholderLockees } from '@/embedded/chastikey-stats'
import { TrackedUser } from '@/objects/user/'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'ChastiKey',
  controller: ckStatsRouterSub,
  description: 'Help.ChastiKey.LockeeStats.Description',
  example: '{{prefix}}ck stats lockee',
  middleware: [Middleware.isCKVerified],
  name: 'ck-get-stats-lockee',
  permissions: {
    defaultEnabled: false,
    serverOnly: false
  },
  slash: new SlashCommandBuilder()
    .setName('ck')
    .setDescription('View ChastiKey Stats')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('stats')
        .setDescription('View ChastiKey Lockee Stats')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Type of ChastiKey Stats to return')
            .setRequired(true)
            .addChoice('Lockee', 'lockee')
            .addChoice('Lockees', 'lockees')
            .addChoice('Keyholder', 'keyholder')
            .addChoice('Multilocked', 'multilocked')
        )
        .addStringOption((option) => option.setName('username').setDescription('Specify a username to lookup a different user'))
    ),
  validate: '/ck:string/stats:string/lockee:string/user?=string'
})

function ckStatsRouterSub(routed: RouterRouted) {
  const interactionType = routed.isInteraction ? routed.interaction.options.get('type')?.value : null
  if (routed.isInteraction) {
    if (interactionType === 'lockee') return getLockeeStats(routed)
    if (interactionType === 'lockees') return getKeyholderLockees(routed)
    if (interactionType === 'keyholder') return getKeyholderStats(routed)
    if (interactionType === 'multilocked') return getCheckLockeeMultiLocked(routed)
  }
  // Fallback - Legacy command call
  return getLockeeStats(routed)
}

async function getLockeeStats(routed: RouterRouted) {
  // Check if username was specified from slash commands or from legacy command
  const username = routed.interaction.options.get('username')?.value as string

  // Get user from lockee data (Stats, User and Locks)
  const lockeeData = await routed.bot.Service.ChastiKey.fetchAPILockeeData({
    username: username ? username : undefined,
    discordid: !username ? routed.author.id : undefined,
    showDeleted: true
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
      ? (await routed.bot.DB.get<TrackedUser>('users', { id: String(lockeeData.data.discordID) })) ||
        // Fallback: Create a mock record
        <TrackedUser>{ ChastiKey: { username: lockeeData.data.username, isVerified: false, ticker: { showStarRatingScore: true } } }
      : // Else when its the caller themself: Lookup the user by Discord ID
        routed.user

  // Generate compiled stats
  await routed.reply({ embeds: [lockeeStats(lockeeData, { showRating: kieraUser.ChastiKey.ticker.showStarRatingScore }, routed)] })

  return true
}

async function getKeyholderStats(routed: RouterRouted) {
  // Check if username was specified from slash commands or from legacy command
  const username = routed.interaction.options.get('username')?.value as string

  // Get user from lockee data (Stats, User and Locks)
  const keyholderData = await routed.bot.Service.ChastiKey.fetchAPIKeyholderData({
    username: username ? username : undefined,
    discordid: !username ? routed.author.id : undefined
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
  var user = username
    ? new TrackedUser(
        await routed.bot.DB.get<TrackedUser>('users', {
          $or: [{ id: String(keyholderData.data.discordID) || 123 }, { 'ChastiKey.username': new RegExp(`^${keyholderData.data.username}$`, 'i') }]
        })
      ) ||
      // Fallback: Create a mock record
      new TrackedUser(<any>{
        __notStored: true,
        ChastiKey: {
          username: keyholderData.data.username,
          preferences: {
            keyholder: { showAverage: false }
          },
          ticker: { showStarRatingScore: true }
        }
      })
    : new TrackedUser(
        await routed.bot.DB.get<TrackedUser>('users', { id: routed.author.id })
      )

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
        locksArrayByLockedTime: { $addToSet: '$timestampLocked' },
        locks: {
          $push: {
            fixed: { $toBool: '$fixed' },
            timerHidden: { $toBool: '$timerHidden' },
            lockFrozenByKeyholder: { $toBool: '$lockFrozenByKeyholder' },
            lockFrozenByCard: { $toBool: '$lockFrozenByCard' },
            keyholder: '$lockedBy',
            noOfTurns: '$noOfTurns',
            secondsLocked: { $subtract: [Date.now() / 1000, '$timestampLocked'] },
            sharedLockName: '$lockName',
            cumulative: { $toBool: '$cumulative' }
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 1,
        keyholders: 1,
        locks: 1,
        uniqueCount: { $cond: { if: { $isArray: '$locksArrayByLockedTime' }, then: { $size: '$locksArrayByLockedTime' }, else: 0 } },
        count: 1
      }
    },
    { $sort: { count: -1 } }
  ])

  // Set cached timestamp for running locks - this SHOULD be close or the same as the KH re-cached time
  const cachedTimestampFromFetch = await routed.bot.DB.get<{ name: string; lastFinishedAt: string }>('scheduled-jobs', { name: 'ChastiKeyAPIRunningLocks' })
  const cachedTimestamp = Number(cachedTimestampFromFetch.lastFinishedAt)

  // Send stats
  await routed.reply({
    embeds: [
      keyholderStats(keyholderData.data, cachedRunningLocks, cachedTimestamp, routed.routerStats, {
        showRating: user.ChastiKey.ticker.showStarRatingScore,
        showAverage: user.ChastiKey.preferences.keyholder.showAverage
      })
    ]
  })

  // Successful end
  return true
}

async function getCheckLockeeMultiLocked(routed: RouterRouted) {
  // Check if username was specified from slash commands or from legacy command
  const username = routed.interaction.options.get('username')?.value as string

  // Get user from lockee data (Stats, User and Locks)
  const keyholderData = await routed.bot.Service.ChastiKey.fetchAPIKeyholderData({
    username: username ? username : undefined,
    discordid: username ? undefined : routed.author.id
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
  const activeLocks = await routed.bot.DB.aggregate<any>('ck-running-locks', [
    {
      $match: { lockedBy: { $ne: null } }
    },
    {
      $group: {
        _id: '$username',
        keyholders: {
          $addToSet: '$lockedBy'
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        uniqueKHCount: { $cond: { if: { $isArray: '$keyholders' }, then: { $size: '$keyholders' }, else: 0 } },
        keyholders: 1,
        count: 1
      }
    },
    { $match: { count: { $gt: 1 }, uniqueKHCount: { $gt: 1 }, keyholders: { $in: [keyholderData.data.username] } } },
    { $sort: { count: -1 } }
  ])

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = await routed.bot.DB.get<{ name: string; lastFinishedAt: string }>('scheduled-jobs', { name: 'ChastiKeyAPIRunningLocks' })
  const cachedTimestamp = Number(cachedTimestampFromFetch.lastFinishedAt)

  await routed.reply({ embeds: [sharedKeyholdersStats(activeLocks, keyholderData.data.username, routed.routerStats, cachedTimestamp)] })

  // Successful end
  return true
}

async function getKeyholderLockees(routed: RouterRouted) {
  // Check if username was specified from slash commands or from legacy command
  const username = routed.interaction.options.get('username')?.value as string

  // Get user from lockee data (Stats, User and Locks)
  const keyholderData = await routed.bot.Service.ChastiKey.fetchAPIKeyholderData({
    username: username ? username : undefined,
    discordid: username ? undefined : routed.author.id
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
  const activeLocks = await routed.bot.DB.aggregate<any>('ck-running-locks', [
    {
      $match: { lockedBy: keyholderData.data.username }
    },
    {
      $group: {
        _id: '$username',
        keyholders: {
          $addToSet: '$lockedBy'
        },
        locks: {
          $push: {
            fixed: { $toBool: '$fixed' },
            timerHidden: { $toBool: '$timerHidden' },
            lockFrozenByKeyholder: { $toBool: '$lockFrozenByKeyholder' },
            lockFrozenByCard: { $toBool: '$lockFrozenByCard' },
            keyholder: '$lockedBy'
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ])

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = await routed.bot.DB.get<{ name: string; lastFinishedAt: string }>('scheduled-jobs', { name: 'ChastiKeyAPIRunningLocks' })
  const cachedTimestamp = Number(cachedTimestampFromFetch.lastFinishedAt)

  await routed.reply({ embeds: [keyholderLockees(activeLocks, keyholderData.data.username, routed.routerStats, cachedTimestamp)] })

  // Successful end
  return true
}
