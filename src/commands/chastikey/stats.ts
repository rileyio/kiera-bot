// import got = require('got');
// import * as Middleware from '../../middleware';
import * as Utils from '../../utils'
import { RouterRouted } from '../../utils';
import { lockeeStats, keyholderStats, sharedKeyholdersStats, TrackedSharedKeyholderStatistics, keyholderLockees } from '../../embedded/chastikey-stats';
import { TrackedUser } from '../../objects/user';
import { TrackedChastiKeyLock, TrackedChastiKeyUserAPIFetch, TrackedChastiKeyLockee, TrackedChastiKeyUserTotalLockedTime, TrackedKeyholderStatistics } from '../../objects/chastikey';
import { performance } from 'perf_hooks';
import { TrackedNotification } from '../../objects/notification';
import { TextChannel } from 'discord.js';
import { ExportRoutes } from '../../router/routes-exporter';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getLockeeStats,
    example: '{{prefix}}ck stats lockee',
    name: 'ck-get-stats-lockee',
    validate: '/ck:string/stats:string/lockee:string/user?=string',
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getKeyholderStats,
    example: '{{prefix}}ck stats keyholder "Username"',
    name: 'ck-get-stats-keyholder',
    validate: '/ck:string/stats:string/keyholder:string/user?=string',
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getCheckLockeeMultiLocked,
    example: '{{prefix}}ck check multilocked KeyHolderName',
    permissions: {
      restricted: true
    },
    name: 'ck-check-multilocked',
    validate: '/ck:string/check:string/multilocked:string/user=string',
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getKeyholderLockees,
    example: '{{prefix}}ck keyholder lockees KeyHolderName',
    name: 'ck-keyholder-lockees',
    validate: '/ck:string/keyholder:string/lockees:string/user=string',
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
  // const userFromAPIresp = await got(`https://api.chastikey.com/v0.2/listlocks.php?username=${user.ChastiKey.username}&bot=Kiera`, { json: true })
  // const userFromAPI: TrackedChastiKeyUserAPIFetch = userFromAPIresp.body

  // console.log('activeLocks', activeLocks)
  // console.log(userInLockeeStats)
  // console.log(userInLockeeTotals)
  // console.log('userFromAPIresp.body', userFromAPIresp.body)

  await routed.message.channel.send(lockeeStats({
    averageLocked: (userInLockeeStats) ? userInLockeeStats.averageTimeLockedInSeconds : 0,
    averageRating: (userInLockeeStats) ? userInLockeeStats.averageRating : '-',
    cacheTimestamp: (activeLocks.length > 0) ? activeLocks[0].timestampNow : '',
    locks: activeLocks,
    longestLock: (userInLockeeStats) ? userInLockeeStats.longestCompletedLockInSeconds : 0,
    monthsLocked: (userInLockeeTotals) ? userInLockeeTotals.totalMonthsLocked : '-',
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
  const activeLocks = await routed.bot.DB.aggregate('ck-running-locks', [
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
}

export async function getKeyholderLockees(routed: RouterRouted) {
  // Generate regex for username to ignore case
  const usernameRegex = new RegExp(`^${routed.v.o.user}$`, 'i')
  // Get lockees under a KH
  const activeLocks = await routed.bot.DB.aggregate('ck-running-locks', [
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
}