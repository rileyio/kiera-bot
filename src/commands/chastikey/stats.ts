import got = require('got');
import * as APIUrls from '../../api-urls';
import * as Middleware from '../../middleware';
import * as Utils from '../../utils'
import { RouterRouted } from '../../utils';
import { lockeeStats, keyholderStats, sharedKeyholdersStats, keyholderLockees } from '../../embedded/chastikey-stats';
import { TrackedUser } from '../../objects/user';
import { TrackedChastiKeyLock, TrackedChastiKeyLockee, TrackedChastiKeyUserTotalLockedTime, TrackedChastiKeyKeyholderStatistics, TrackedChastiKey, TrackedChastiKeyUser, TrackedChastiKeyUserAPIFetch } from '../../objects/chastikey';
import { TrackedNotification } from '../../objects/notification';
import { TextChannel, Message } from 'discord.js';
import { ExportRoutes } from '../../router/routes-exporter';
import { TrackedMessage } from '../../objects/message';
import { TrackedBotSetting } from '../../objects/setting';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getLockeeStats,
    example: '{{prefix}}ck stats lockee',
    name: 'ck-get-stats-lockee',
    validate: '/ck:string/stats:string/lockee:string/user?=string',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: getKeyholderStats,
    example: '{{prefix}}ck stats keyholder UsernameHere',
    name: 'ck-get-stats-keyholder',
    validate: '/ck:string/stats:string/keyholder:string/user?=string',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
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
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
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
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: setKHAverageDisplay,
    example: '{{prefix}}ck keyholder set average show',
    name: 'ck-set-kh-average-display',
    validate: '/ck:string/keyholder:string/set:string/average:string/state=string',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: false,
      serverOnly: false
    }
  }
)

export async function getLockeeStats(routed: RouterRouted) {
  // Find the user in ck-users first to help determine query for Kiera's DB (Find based off Username if requested)
  var ckUser = (routed.v.o.user)
    ? new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { username: new RegExp(`^${routed.v.o.user}$`, 'i') }))
    : new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { discordID: routed.user.id }))

  // If the lookup is upon someone else with no data, return the standard response
  if (ckUser._noData === true && routed.v.o.user) {
    // Notify in chat what the issue could be
    await routed.message.reply(Utils.sb(Utils.en.chastikey.userLookupErrorOrNotFound, { user: routed.v.o.user }))
    return true // Stop here
  }

  // Get user's current ChastiKey username from users collection or by the override
  const user = (routed.v.o.user)
    ? await routed.bot.DB.get<TrackedUser>('users', { $or: [{ id: String(ckUser.discordID) }, { 'ChastiKey.username': new RegExp(`^${ckUser.username}$`, 'i') }] })
    // Fallback: Create a mock record
    || (<TrackedUser>{ __notStored: true, ChastiKey: { username: ckUser.username, isVerified: false, ticker: { showStarRatingScore: true } } })
    // Else: Lookup the user by Discord ID
    : await routed.bot.DB.get<TrackedUser>('users', { id: routed.user.id })

  // If the lookup is not upon someone else & the requestor's account is not yet verified: stop and inform
  if (ckUser._noData && !routed.v.o.user && !user.ChastiKey.isVerified) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.verifyVerifyReq2))
    return false // Stop
  }

  // If the user is verified in the Kiera table (meaning they followed the FF steps)
  if (ckUser._noData && !routed.v.o.user && user.ChastiKey.isVerified) {
    // Update the ckUser record for this run to let them see stuff
    ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { username: user.ChastiKey.username }))
  }

  // If the user has display_in_stats === 2 then stop here
  if (!ckUser.displayInStats) {
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

  // Check to see if there are any notifications programmed for this user in the db
  const userNotifyConfig = (routed.v.o.user && user._id && user.__notStored === undefined)
    ? await routed.bot.DB.get<TrackedNotification>('notifications', {
      authorID: routed.user.id,
      serverID: routed.message.guild.id,
      name: 'notify-ck-stats-lockee'
    })
    : null

  // Get current locks by user store in the collection
  const cachedRunningLocks = await routed.bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', { username: ckUser.username })
  // Get user from lockee data (Total locks, raitings, averages)
  const userInLockeeStats = new TrackedChastiKeyLockee(await routed.bot.DB.get<TrackedChastiKeyLockee>('ck-lockees', { username: ckUser.username }))

  // User has no data in the Lockee stats db
  // Causes
  //  - Have not opened the App in >=2 week
  //  - Wrong Username set with Kiera
  if (!userInLockeeStats._hasDBData) {
    // Notify in chat what the issue could be
    await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsMissing, { user: routed.v.o.user }))
    return true // Stop here
  }

  // Get all API locks
  const apiResponse: got.Response<TrackedChastiKeyUserAPIFetch> = await got(`${APIUrls.ChastiKey.ListLocks}?username=${user.ChastiKey.username}`, { json: true })
  var apiLockeeLocks = apiResponse.body.locks

  // Generate
  var compiledLockeeStats = Utils.ChastiKey.compileLockeeStats(ckUser, userInLockeeStats, cachedRunningLocks, apiLockeeLocks, routed.routerStats)

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
  const cachedTimestamp = cachedTimestampFromFetch.value

  await routed.message.channel.send(lockeeStats(compiledLockeeStats, { showRating: user.ChastiKey.ticker.showStarRatingScore }, cachedTimestamp))

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
  // Find the user in ck-users first to help determine query for Kiera's DB (Find based off Username if requested)
  var ckUser = (routed.v.o.user)
    ? new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { username: new RegExp(`^${routed.v.o.user}`) }))
    : new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { discordID: routed.user.id }))

  // If the lookup is upon someone else with no data, return the standard response
  if (ckUser._noData === true && routed.v.o.user) {
    // Notify in chat what the issue could be
    await routed.message.reply(Utils.sb(Utils.en.chastikey.userLookupErrorOrNotFound))
    return true // Stop here
  }

  // If the user has display_in_stats === 2 then stop here
  if (!ckUser.displayInStats) {
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

  // Get user's current ChastiKey username from users collection or by the override
  var user = (routed.v.o.user)
    ? new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', { $or: [{ id: String(ckUser.discordID) || 123 }, { 'ChastiKey.username': new RegExp(`^${ckUser.username}$`, 'i') }] }))
    // Fallback: Create a mock record
    || new TrackedUser(<any>{
      __notStored: true,
      ChastiKey: {
        username: ckUser.username,
        preferences: {
          keyholder: { showAverage: false }
        },
        ticker: { showStarRatingScore: true }
      }
    })
    : await routed.bot.DB.get<TrackedUser>('users', { id: routed.message.author.id })

  // If the lookup is not upon someone else & the requestor's account is not yet verified: stop and inform
  if (ckUser._noData && !routed.v.o.user && !user.ChastiKey.isVerified) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.verifyVerifyReq2))
    return false // Stop
  }

  // If the user is verified in the Kiera table (meaning they followed the FF steps)
  if (ckUser._noData && !routed.v.o.user && user.ChastiKey.isVerified) {
    // Update the ckUser record for this run to let them see stuff
    ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyUser>('ck-users', { username: user.ChastiKey.username }))
  }

  // Check to see if there are any notifications programmed for this user in the db
  const userNotifyConfig = (routed.v.o.user && user._id && user.__notStored === undefined)
    ? await routed.bot.DB.get<TrackedNotification>('notifications', {
      authorID: routed.user.id,
      serverID: routed.message.guild.id,
      name: 'notify-ck-stats-keyholder'
    })
    : null

  // Generate regex for username to ignore case
  const usernameRegex = new RegExp(`^${ckUser.username}$`, 'i')

  // Get current locks by user store in the collection
  var keyholder = await routed.bot.DB.get<TrackedChastiKeyKeyholderStatistics>('ck-keyholders', { username: usernameRegex })

  // If there is no data in the kh dataset inform the user
  if (!keyholder) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.keyholderNoLocks))
    return false // stop here
  }

  // Get lockees under a KH
  const cachedRunningLocks = await routed.bot.DB.aggregate<{ _id: string, locks: Array<any>, count: number, uniqueCount: number }>('ck-running-locks', [
    {
      $match: { lockedBy: ckUser.username }
    },
    {
      $group: {
        _id: '$username',
        locksArrayByLockedTime: { $addToSet: '$secondsLocked' },
        locks: {
          $push: {
            fixed: { $toBool: '$fixed' },
            timerHidden: { $toBool: '$timerHidden' },
            lockFrozenByKeyholder: { $toBool: '$lockFrozenByKeyholder' },
            lockFrozenByCard: { $toBool: '$lockFrozenByCard' },
            keyholder: '$lockedBy',
            noOfTurns: '$noOfTurns',
            secondsLocked: '$secondsLocked',
            sharedLockName: '$sharedLockName'
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

  // Init TrackedKeyholder
  keyholder = new TrackedChastiKeyKeyholderStatistics(keyholder)

  // Set cached timestamp for running locks - this SHOULD be close or the same as the KH re-cached time
  const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
  const cachedTimestamp = cachedTimestampFromFetch.value

  // Send stats
  await routed.message.channel.send(keyholderStats(keyholder, cachedRunningLocks, cachedTimestamp, routed.routerStats, {
    showRating: user.ChastiKey.ticker.showStarRatingScore,
    showAverage: user.ChastiKey.preferences.keyholder.showAverage,
    isVerified: ckUser.isVerified()
  }))

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

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
  const cachedTimestamp = cachedTimestampFromFetch.value

  await routed.message.reply(sharedKeyholdersStats(activeLocks, routed.v.o.user, routed.routerStats, cachedTimestamp))

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
            timerHidden: { $toBool: '$timerHidden' },
            lockFrozenByKeyholder: { $toBool: '$lockFrozenByKeyholder' },
            lockFrozenByCard: { $toBool: '$lockFrozenByCard' },
            keyholder: '$lockedBy',
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


  await routed.message.reply(keyholderLockees(activeLocks, routed.v.o.user, routed.routerStats, cachedTimestamp))

  // Successful end
  return true
}

export async function setKHAverageDisplay(routed: RouterRouted) {
  // True or False sent
  if (routed.v.o.state.toLowerCase() === 'show' || routed.v.o.state.toLowerCase() === 'hide') {
    await routed.bot.DB.update('users', { id: routed.user.id },
      { $set: { 'ChastiKey.preferences.keyholder.showAverage': `show` ? routed.v.o.state === 'show' : false } },
      { atomic: true })

    await routed.message.reply(`:white_check_mark: ChastiKey Preference: \`Display keyholder time average\` is now ${routed.v.o.state === 'show' ? '`shown`' : '`hidden`'}`)
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck keyholder set average show ${routed.v.o.state}`)

    return true
  }
  else {
    await routed.message.reply(`Failed to set ChastiKey Rating Display, format must be like: \`show\``)
    routed.bot.DEBUG_MSG_COMMAND.log(`{{prefix}}ck keyholder set average show ${routed.v.o.state}`)

    return true
  }
}
