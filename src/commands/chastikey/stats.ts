import got = require('got');
// import * as Middleware from '../../middleware';
import * as Utils from '../../utils'
import { RouterRouted } from '../../utils';
import { lockeeStats, keyholderStats, sharedKeyholdersStats, TrackedSharedKeyholderStatistics, keyholderLockees } from '../../embedded/chastikey-stats';
import { TrackedUser } from '../../objects/user';
import { TrackedChastiKeyLock, TrackedChastiKeyUserAPIFetch, TrackedChastiKeyLockee, TrackedChastiKeyUserTotalLockedTime, TrackedKeyholderStatistics } from '../../objects/chastikey';
import { performance } from 'perf_hooks';
import { TrackedNotification } from '../../objects/notification';
import { TextChannel, Message } from 'discord.js';
import { ExportRoutes } from '../../router/routes-exporter';
import { TrackedMessage } from '../../objects/message';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getLockeeStats,
    example: '{{prefix}}ck stats lockee',
    name: 'ck-get-stats-lockee',
    validate: '/ck:string/stats:string/lockee:string/user?=string',
    permissions: {
      defaultEnabled: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getKeyholderStats,
    example: '{{prefix}}ck stats keyholder "Username"',
    name: 'ck-get-stats-keyholder',
    validate: '/ck:string/stats:string/keyholder:string/user?=string',
    permissions: {
      defaultEnabled: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getCheckLockeeMultiLocked,
    example: '{{prefix}}ck check multilocked KeyHolderName',
    name: 'ck-check-multilocked',
    validate: '/ck:string/check:string/multilocked:string/user=string',
    permissions: {
      defaultEnabled: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getKeyholderLockees,
    example: '{{prefix}}ck keyholder lockees KeyHolderName',
    name: 'ck-keyholder-lockees',
    validate: '/ck:string/keyholder:string/lockees:string/user=string',
    permissions: {
      defaultEnabled: false
    }
  }
)

export async function getLockeeStats(routed: RouterRouted) {
  var _performance = {
    start: performance.now(),
    end: undefined
  }

  // Get user's current ChastiKey username from users collection or by the override
  const user = (routed.v.o.user)
    ? await routed.bot.DB.get<TrackedUser>('users', { 'ChastiKey.username': new RegExp(`^${routed.v.o.user}$`, 'i') }) ||
    (<TrackedUser>{ __notStored: true, ChastiKey: { username: routed.v.o.user, ticker: { showStarRatingScore: true } } })
    : await routed.bot.DB.get<TrackedUser>('users', { id: routed.message.author.id })

  // If someone else is looking up a user
  // const userToNotifyConfig = (routed.v.o.user)
  //   ? await routed.bot.DB.get<TrackedUser>('users', { 'ChastiKey.username': new RegExp(`^${routed.v.o.user}$`, 'i') })
  //   : undefined
  // Check to see if there are any notifications programmed for this user in the db
  const userNotifyConfig = (routed.v.o.user && user._id && user.__notStored === undefined)
    ? await routed.bot.DB.get<TrackedNotification>('notifications', {
      authorID: user.id,
      serverID: routed.message.guild.id,
      name: 'notify-ck-stats-lockee'
    })
    : null
  // If user does not have a ChastiKey username set, warn them
  if (user.ChastiKey.username === '') {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.usernameNotSet))
    return false; // Stop here
  }

  // Generate regex for username to ignore case
  const usernameRegex = new RegExp(`^${user.ChastiKey.username}$`, 'i')

  // Get current locks by user store in the collection
  const activeLocks = await routed.bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', { username: usernameRegex })
  // Get user from lockee data (Total locks, raitings, averages)
  const userInLockeeStats = await routed.bot.DB.get<TrackedChastiKeyLockee>('ck-lockees', { username: usernameRegex })
  // Get user from lockee data (Total locks, raitings, averages)
  const userInLockeeTotals = await routed.bot.DB.get<TrackedChastiKeyUserTotalLockedTime>('ck-lockee-totals', { username: usernameRegex })
  // Get user data from API for Keyholder name
  var calculatedCumulative = (userInLockeeTotals) ? userInLockeeTotals.totalMonthsLocked : 0
  try {
    const userPastLocksFromAPIresp = await got(`http://chastikey.com/api/v0.3/listlocks2.php?username=${user.ChastiKey.username}&showdeleted=1&bot=Kiera`, { json: true })
    const userCurrentLocksFromAPIresp = await got(`http://chastikey.com/api/v0.3/listlocks2.php?username=${user.ChastiKey.username}&showdeleted=0&bot=Kiera`, { json: true })
    var dates = [].concat(userPastLocksFromAPIresp.body.locks, userCurrentLocksFromAPIresp.body.locks)

    // For any dates with a { ... end: 0 } set the 0 to the current timestamp (still active)
    dates = dates.map(d => {
      // Insert current date on existing locked locks that are not deleted
      // console.log(d.timestampUnlocked === 0 && d.status === 'Locked' && d.lockDeleted === 0, d.timestampLocked)

      // Remove unlocked time if the lock status is: Locked, Deleted and has a Completion timestamp
      if (d.timestampUnlocked > 0 && d.status === 'Locked' && d.lockDeleted === 1) {
        // console.log('set to:', 0)
        d.timestampUnlocked = 0
      }

      if (d.timestampUnlocked === 0 && (d.status === 'Locked' || d.status === 'ReadyToUnlock') && d.lockDeleted === 0) {
        // console.log('set to:', Math.round(Date.now() / 1000))
        d.timestampUnlocked = Math.round(Date.now() / 1000)
      }

      // Transform data a little
      return { start: d.timestampLocked, end: d.timestampUnlocked }
    })

    // Calculate cumulative using algorithm
    var cumulativeCalc = Utils.Date.calculateCumulativeRange(dates)
    calculatedCumulative = Math.round((cumulativeCalc.cumulative / 2592000) * 100) / 100
    // Calculate average
    // console.log('!!! Average:', cumulativeCalc.average)
    // console.log('!!! Average:', Utils.Date.calculateHumanTimeDDHHMM(cumulativeCalc.average))

  } catch (error) {
    calculatedCumulative = (userInLockeeTotals) ? userInLockeeTotals.totalMonthsLocked : NaN
  }

  // If the user has display_in_stats === 2 then stop here
  if (activeLocks.length > 0 ? activeLocks[0].display_in_stats === 2 : false) {
    // Track incoming message and delete for the target user's privacy
    await routed.bot.MsgTracker.trackMsg(new TrackedMessage({
      authorID: routed.message.author.id,
      id: routed.message.id,
      messageCreatedAt: routed.message.createdAt.getTime(),
      channelId: routed.message.channel.id,
      // Flags
      flagAutoDelete: true,
      flagTrack: true,
      // Deletion settings
      storageKeepInChatFor: 5000
    }))
    // Notify in chat that the user has requested their stats not be public
    const response = await routed.message.reply(Utils.sb(Utils.en.chastikey.userRequestedNoStats)) as Message
    // Track incoming message and delete for the target user's privacy
    await routed.bot.MsgTracker.trackMsg(new TrackedMessage({
      authorID: response.author.id,
      id: response.id,
      messageCreatedAt: response.createdAt.getTime(),
      channelId: response.channel.id,
      // Flags
      flagAutoDelete: true,
      flagTrack: true,
      // Deletion settings
      storageKeepInChatFor: 15000
    }))
    // Stop here
    return true
  }

  // console.log('activeLocks', activeLocks)
  // console.log(userInLockeeStats)
  // console.log(userInLockeeTotals)
  // console.log('userFromAPIresp.body', userFromAPIresp.body)

  await routed.message.channel.send(lockeeStats({
    averageLocked: (userInLockeeStats) ? cumulativeCalc.average : userInLockeeStats.averageTimeLockedInSeconds,
    averageRating: (userInLockeeStats) ? userInLockeeStats.averageRating : '-',
    cacheTimestamp: (activeLocks.length > 0) ? activeLocks[0].timestampNow : '',
    locks: activeLocks,
    longestLock: (userInLockeeStats) ? userInLockeeStats.longestCompletedLockInSeconds : 0,
    monthsLocked: (calculatedCumulative),
    noOfRatings: (userInLockeeStats) ? userInLockeeStats.noOfRatings : 0,
    totalNoOfCompletedLocks: (userInLockeeStats) ? userInLockeeStats.totalNoOfCompletedLocks : 0,
    username: user.ChastiKey.username,
    joined: (userInLockeeStats) ? userInLockeeStats.joined : '-',
    _performance: _performance
  }, { showRating: user.ChastiKey.ticker.showStarRatingScore }))

  // Notify the stats owner if that's applicable
  if (userNotifyConfig !== null) {
    if (userNotifyConfig.where !== 'Discord' || userNotifyConfig.state !== true) return // stop here
    // BLOCK: If in blacklisted channel by server settings //
    const serverBlackListedChannels = await routed.bot.DB.verify('server-settings', {
      serverID: routed.message.guild.id,
      value: routed.message.channel.id,
      key: 'server.channel.notification.block',
      state: true
    })
    // BLOCK: If blacklisted validate === true
    if (serverBlackListedChannels) return true

    // Send DM to user
    await routed.bot.client.users.get(user.id)
      .send(Utils.sb(Utils.en.chastikey.lockeeCommandNotification, {
        user: `${routed.message.author.username}#${routed.message.author.discriminator}`,
        channel: (<TextChannel>routed.message.channel).name,
        server: routed.message.guild.name
      }))
  }

  return true
}

export async function getKeyholderStats(routed: RouterRouted) {
  // Get user's current ChastiKey username from users collection or by the override
  const user = (routed.v.o.user)
    ? await routed.bot.DB.get<TrackedUser>('users', { 'ChastiKey.username': new RegExp(`^${routed.v.o.user}$`, 'i') }) ||
    (<TrackedUser>{ __notStored: true, ChastiKey: { username: routed.v.o.user, ticker: { showStarRatingScore: true } } })
    : await routed.bot.DB.get<TrackedUser>('users', { id: routed.message.author.id })

  // If someone else is looking up a user
  // const userToNotifyConfig = (routed.v.o.user)
  //   ? await routed.bot.DB.get<TrackedUser>('users', { 'ChastiKey.username': new RegExp(`^${routed.v.o.user}$`, 'i') })
  //   : undefined
  // Check to see if there are any notifications programmed for this user in the db
  // Check to see if there are any notifications programmed for this user in the db
  const userNotifyConfig = (routed.v.o.user && user._id && user.__notStored === undefined)
    ? await routed.bot.DB.get<TrackedNotification>('notifications', {
      authorID: user.id,
      serverID: routed.message.guild.id,
      name: 'notify-ck-stats-keyholder'
    })
    : null

  // If user does not have a ChastiKey username set, warn them (& none was passed)
  if (user.ChastiKey.username === '') {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.usernameNotSet))
    return false; // Stop here
  }

  // Generate regex for username to ignore case
  const usernameRegex = new RegExp(`^${user.ChastiKey.username}$`, 'i')

  // Get current locks by user store in the collection
  const keyholder = await routed.bot.DB.get<TrackedKeyholderStatistics>('ck-keyholders', { username: usernameRegex })
  // If there is no data in the kh dataset inform the user
  if (!keyholder) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.keyholderNoLocks))
    return false // stop here
  }

  // Send stats
  await routed.message.channel.send(keyholderStats(keyholder, { showRating: user.ChastiKey.ticker.showStarRatingScore }))
  // Notify the stats owner if that's applicable
  if (userNotifyConfig !== null) {
    if (userNotifyConfig.where !== 'Discord' || userNotifyConfig.state !== true) return // stop here
    // BLOCK: If in blacklisted channel by server settings //
    const serverBlackListedChannels = await routed.bot.DB.verify('server-settings', {
      serverID: routed.message.guild.id,
      value: routed.message.channel.id,
      key: 'server.channel.notification.block',
      state: true
    })
    // BLOCK: If blacklisted validate === true
    if (serverBlackListedChannels) return true

    // Send DM to user
    await routed.bot.client.users.get(user.id)
      .send(Utils.sb(Utils.en.chastikey.keyholderCommandNotification, {
        user: `${routed.message.author.username}#${routed.message.author.discriminator}`,
        channel: (<TextChannel>routed.message.channel).name,
        server: routed.message.guild.name
      }))
  }

  // Successful end
  return true
}

export async function getCheckLockeeMultiLocked(routed: RouterRouted) {
  // Generate regex for username to ignore case
  const usernameRegex = new RegExp(`^${routed.v.o.user}$`, 'i')
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
    { $match: { count: { $gt: 1 }, uniqueKHCount: { $gt: 1 }, keyholders: { $in: [usernameRegex] } } },
    { $sort: { count: -1 } }
  ])

  await routed.message.reply(sharedKeyholdersStats(activeLocks, routed.v.o.user))

  // Successful end
  return true
}

export async function getKeyholderLockees(routed: RouterRouted) {
  // Generate regex for username to ignore case
  const usernameRegex = new RegExp(`^${routed.v.o.user}$`, 'i')
  // Get lockees under a KH
  const activeLocks = await routed.bot.DB.aggregate<any>('ck-running-locks', [
    {
      $match: { lockedBy: usernameRegex }
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
            timer_hidden: { $toBool: '$timer_hidden' },
            lock_frozen_by_keyholder: { $toBool: '$lock_frozen_by_keyholder' },
            lock_frozen_by_card: { $toBool: '$lock_frozen_by_card' },
            keyholder: '$lockedBy',
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ])

  await routed.message.reply(keyholderLockees(activeLocks, routed.v.o.user))

  // Successful end
  return true
}