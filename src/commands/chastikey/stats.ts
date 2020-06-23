import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { lockeeStats, keyholderStats, sharedKeyholdersStats, keyholderLockees } from '@/embedded/chastikey-stats'
import { TrackedUser } from '@/objects/user'
import { TrackedBotSetting } from '@/objects/setting'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    controller: getLockeeStats,
    description: 'Help.ChastiKey.LockeeStats.Description',
    example: '{{prefix}}ck stats lockee',
    name: 'ck-get-stats-lockee',
    validate: '/ck:string/stats:string/lockee:string/user?=string',
    middleware: [Middleware.isCKVerified],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    controller: getKeyholderStats,
    description: 'Help.ChastiKey.KeyholderStats.Description',
    example: '{{prefix}}ck stats keyholder UsernameHere',
    name: 'ck-get-stats-keyholder',
    validate: '/ck:string/stats:string/keyholder:string/user?=string',
    middleware: [Middleware.isCKVerified],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    controller: getCheckLockeeMultiLocked,
    description: 'Help.ChastiKey.CheckKeyholderMultilocked.Description',
    example: '{{prefix}}ck check multilocked KeyHolderName',
    name: 'ck-check-multilocked',
    validate: '/ck:string/check:string/multilocked:string/user?=string',
    middleware: [Middleware.isCKVerified],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    controller: getKeyholderLockees,
    description: 'Help.ChastiKey.KeyholderLockees.Description',
    example: '{{prefix}}ck keyholder lockees',
    name: 'ck-keyholder-lockees',
    validate: '/ck:string/keyholder:string/lockees:string',
    middleware: [Middleware.isCKVerified],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    controller: setKHAverageDisplay,
    description: 'Help.ChastiKey.ToggleKeyholderAverageDisplayed.Description',
    example: '{{prefix}}ck keyholder set average show',
    name: 'ck-set-kh-average-display',
    validate: '/ck:string/keyholder:string/set:string/average:string/state=string',
    middleware: [Middleware.isCKVerified],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  }
)

export async function getLockeeStats(routed: RouterRouted) {
  // Get user from lockee data (Stats, User and Locks)
  const lockeeData = await routed.bot.Service.ChastiKey.fetchAPILockeeData({
    username: routed.v.o.user ? routed.v.o.user : undefined,
    discordid: !routed.v.o.user ? routed.author.id : undefined,
    showDeleted: true
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (lockeeData.response.status !== 200) {
    if (routed.v.o.username) {
      // Notify in chat what the issue could be for the target user
      await routed.message.reply(routed.$render('ChastiKey.Error.UserLookupErrorOrNotFound'))
    } else {
      // Notify in chat what the issue could be for the user's own account
      await routed.message.reply(routed.$render('ChastiKey.Error.SelfLookupErrorOrNotFound'))
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
    routed.v.o.user && lockeeData.data.discordID
      ? (await routed.bot.DB.get<TrackedUser>('users', { id: String(lockeeData.data.discordID) })) ||
        // Fallback: Create a mock record
        <TrackedUser>{ ChastiKey: { username: lockeeData.data.username, isVerified: false, ticker: { showStarRatingScore: true } } }
      : // Else when its the caller themself: Lookup the user by Discord ID
        routed.user

  // Generate compiled stats
  await routed.message.channel.send(lockeeStats(lockeeData, { showRating: kieraUser.ChastiKey.ticker.showStarRatingScore }, routed))

  return true
}

export async function getKeyholderStats(routed: RouterRouted) {
  // Get user from lockee data (Stats, User and Locks)
  const keyholderData = await routed.bot.Service.ChastiKey.fetchAPIKeyholderData({
    username: routed.v.o.user ? routed.v.o.user : undefined,
    discordid: !routed.v.o.user ? routed.author.id : undefined
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (keyholderData.response.status !== 200) {
    if (routed.v.o.username) {
      // Notify in chat what the issue could be for the target user
      await routed.message.reply(routed.$render('ChastiKey.Error.UserLookupErrorOrNotFound'))
    } else {
      // Notify in chat what the issue could be for the user's own account
      await routed.message.reply(routed.$render('ChastiKey.Error.SelfLookupErrorOrNotFound'))
    }
    return true // Stop here
  }

  // If the user has display_in_stats === 2 then stop here
  if (keyholderData.data.displayInStats === 2) {
    await Utils.ChastiKey.statsDisabledError(routed)
    return true // Stop here
  }

  // Get user's current ChastiKey username from users collection or by the override
  var user = routed.v.o.user
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
        await routed.bot.DB.get<TrackedUser>('users', { id: routed.message.author.id })
      )

  // If the requested user has never keyheld
  if (keyholderData.data.timestampFirstKeyheld === 0) {
    await routed.message.reply(routed.$render('ChastiKey.Stats.KeyholderNoLocks'))
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
  const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
  const cachedTimestamp = cachedTimestampFromFetch.value

  // Send stats
  await routed.message.channel.send(
    keyholderStats(keyholderData.data, cachedRunningLocks, cachedTimestamp, routed.routerStats, {
      showRating: user.ChastiKey.ticker.showStarRatingScore,
      showAverage: user.ChastiKey.preferences.keyholder.showAverage
    })
  )

  // Successful end
  return true
}

export async function getCheckLockeeMultiLocked(routed: RouterRouted) {
  // Get user from lockee data (Stats, User and Locks)
  const keyholderData = await routed.bot.Service.ChastiKey.fetchAPIKeyholderData({
    username: routed.v.o.user ? routed.v.o.user : undefined,
    discordid: !routed.v.o.user ? routed.author.id : undefined
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (keyholderData.response.status !== 200) {
    // Notify in chat what the issue could be
    await routed.message.reply(routed.$render('ChastiKey.Error.UserNotFound'))
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
  const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
  const cachedTimestamp = cachedTimestampFromFetch.value

  await routed.message.reply(sharedKeyholdersStats(activeLocks, routed.v.o.user, routed.routerStats, cachedTimestamp))

  // Successful end
  return true
}

export async function getKeyholderLockees(routed: RouterRouted) {
  // Get user from lockee data (Stats, User and Locks)
  const keyholderData = await routed.bot.Service.ChastiKey.fetchAPIKeyholderData({
    discordid: routed.author.id
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (keyholderData.response.status !== 200) {
    // Notify in chat what the issue could be
    await routed.message.reply(routed.$render('ChastiKey.Error.UserLookupErrorOrNotFound'))
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
  const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
  const cachedTimestamp = cachedTimestampFromFetch.value

  await routed.message.reply(keyholderLockees(activeLocks, keyholderData.data.username, routed.routerStats, cachedTimestamp))

  // Successful end
  return true
}

export async function setKHAverageDisplay(routed: RouterRouted) {
  // True or False sent
  if (routed.v.o.state.toLowerCase() === 'show' || routed.v.o.state.toLowerCase() === 'hide') {
    await routed.bot.DB.update(
      'users',
      { id: routed.author.id },
      { $set: { 'ChastiKey.preferences.keyholder.showAverage': `show` ? routed.v.o.state === 'show' : false } },
      { atomic: true }
    )

    await routed.message.reply(`:white_check_mark: ChastiKey Preference: \`Display keyholder time average\` is now ${routed.v.o.state === 'show' ? '`shown`' : '`hidden`'}`)
    routed.bot.Log.Command.log(`{{prefix}}ck keyholder set average show ${routed.v.o.state}`)

    return true
  } else {
    await routed.message.reply(`Failed to set ChastiKey Rating Display, format must be like: \`show\``)
    routed.bot.Log.Command.log(`{{prefix}}ck keyholder set average show ${routed.v.o.state}`)

    return true
  }
}
