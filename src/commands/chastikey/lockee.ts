import got = require('got');
import * as APIUrls from '../../api-urls';
import * as Middleware from '../../middleware';
import * as Utils from '../../utils'
import { ExportRoutes } from '../../router/routes-exporter';
import { RouterRouted } from '../../utils';
import { TrackedChastiKeyUser, TrackedChastiKeyLock, TrackedChastiKeyLockee, TrackedChastiKeyUserAPIFetch } from '../../objects/chastikey';
import { lockeeHistory, lockeeHistoryPersonal } from '../../embedded/chastikey-history';
import { TrackedUser } from '../../objects/user';
import { performance } from 'perf_hooks';
import { TrackedBotSetting } from '../../objects/setting';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'none',
    controller: history,
    example: '{{prefix}}ck lockee history',
    name: 'ck-lockee-history',
    validate: '/ck:string/lockee:string/history:string/',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: true,
      serverOnly: false
    }
  },
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'none',
    controller: historyPersonal,
    example: '{{prefix}}ck lockee history personal',
    name: 'ck-lockee-history-personal',
    validate: '/ck:string/lockee:string/history:string/personal:string/',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: true,
      serverOnly: false
    }
  }
)

export async function history(routed: RouterRouted) {
  var _performance = {
    start: performance.now(),
    end: undefined
  }

  // Get user from Cached CK Users collection
  const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyLock>('ck-users', { discordID: routed.user.id }))

  // If user has displayInStats set to false
  if (!ckUser.displayInStats) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.userRequestedNoStats))
    return true // Stop here
  }

  // Get user's current ChastiKey username from users collection or by the override
  const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', { id: routed.user.id }))

  // Get current locks by user store in the collection
  const activeLocks = await routed.bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', { username: ckUser.username })
  // Get user from lockee data (Total locks, raitings, averages)
  const userInLockeeStats = new TrackedChastiKeyLockee(await routed.bot.DB.get<TrackedChastiKeyLockee>('ck-lockees', { username: ckUser.username }))

  // User has no data in the Lockee stats db
  // Causes
  //  - Have not opened the App in >=2 week
  if (!userInLockeeStats._hasDBData || ckUser._noData === true) {
    // Notify in chat what the issue could be
    await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsMissing, { user: ckUser.username }))
    return true // Stop here
  }

  // Get all API locks
  const apiResponse: got.Response<TrackedChastiKeyUserAPIFetch> = await got(`${APIUrls.ChastiKey.ListLocks}?username=${ckUser.username}`, { json: true })
  var apiLockeeLocks = apiResponse.body.locks

  // Generate
  var compiledLockeeStats = Utils.ChastiKey.compileLockeeStats(ckUser, userInLockeeStats, activeLocks, apiLockeeLocks, routed.routerStats)

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
  const cachedTimestamp = cachedTimestampFromFetch.value

  if (routed.message.channel.type === 'text') await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsHistorical))
  await routed.message.author.send(lockeeHistory(ckUser, { showRating: user.ChastiKey.ticker.showStarRatingScore }, compiledLockeeStats, apiLockeeLocks, cachedTimestamp))
  return true
}

export async function historyPersonal(routed: RouterRouted) {
  var _performance = {
    start: performance.now(),
    end: undefined
  }

  // Get user from Cached CK Users collection
  const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyLock>('ck-users', { discordID: routed.user.id }))

  // If user has displayInStats set to false
  if (!ckUser.displayInStats) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.userRequestedNoStats))
    return true // Stop here
  }

  // Get user's current ChastiKey username from users collection or by the override
  const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', { id: routed.user.id }))

  // Get current locks by user store in the collection
  const activeLocks = await routed.bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', { username: ckUser.username })
  // Get user from lockee data (Total locks, raitings, averages)
  const userInLockeeStats = new TrackedChastiKeyLockee(await routed.bot.DB.get<TrackedChastiKeyLockee>('ck-lockees', { username: ckUser.username }))

  // User has no data in the Lockee stats db
  // Causes
  //  - Have not opened the App in >=2 week
  if (!userInLockeeStats._hasDBData || ckUser._noData === true) {
    // Notify in chat what the issue could be
    await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsMissing, { user: ckUser.username }))
    return true // Stop here
  }

  // Get all API locks
  const apiResponse: got.Response<TrackedChastiKeyUserAPIFetch> = await got(`${APIUrls.ChastiKey.ListLocks}?username=${ckUser.username}`, { json: true })
  var apiLockeeLocks = apiResponse.body.locks

  // Generate
  var compiledLockeeStats = Utils.ChastiKey.compileLockeeStats(ckUser, userInLockeeStats, activeLocks, apiLockeeLocks, routed.routerStats)

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
  const cachedTimestamp = cachedTimestampFromFetch.value

  if (routed.message.channel.type === 'text') await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsHistorical))
  await routed.message.author.send(lockeeHistoryPersonal(ckUser, { showRating: user.ChastiKey.ticker.showStarRatingScore }, compiledLockeeStats, apiLockeeLocks, cachedTimestamp))
  return true
}
