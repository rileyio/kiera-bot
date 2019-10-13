import got = require('got');
import * as APIUrls from '../../api-urls';
import * as Middleware from '../../middleware';
import * as Utils from '../../utils'
import { ExportRoutes } from '../../router/routes-exporter';
import { RouterRouted } from '../../utils';
import { TrackedChastiKeyUser, TrackedChastiKeyLock, TrackedChastiKeyLockee, TrackedChastiKeyUserAPIFetch } from '../../objects/chastikey';
import { lockeeHistory } from '../../embedded/chastikey-history';
import { TrackedUser } from '../../objects/user';
import { performance } from 'perf_hooks';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'none',
    controller: history,
    example: '{{prefix}}ck lockee history UsernameHere',
    name: 'ck-lockee-history',
    validate: '/ck:string/lockee:string/history:string/user=string',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: true,
      serverOnly: true
    }
  }
)

export async function history(routed: RouterRouted) {
  await routed.message.reply(`A rework of this command's output is underway. Stay tuned for updates.`)
  return true // Stop here

  var _performance = {
    start: performance.now(),
    end: undefined
  }

  const usernameRegex = new RegExp(`^${routed.v.o.user}$`, 'i')
  // Get user from Cached CK Users collection
  const ckUser = new TrackedChastiKeyUser(await routed.bot.DB.get<TrackedChastiKeyLock>('ck-users', { username: usernameRegex }))

  // If the lookup is upon someone else with no data, return the standard response
  if (ckUser._noData === true && routed.v.o.user) {
    // Notify in chat what the issue could be
    await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsMissing, { user: routed.v.o.user }))
    return true // Stop here
  }

  // If user has displayInStats set to false
  if (!ckUser.displayInStats) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.userRequestedNoStats))
    return true // Stop here
  }

  // Get user's current ChastiKey username from users collection or by the override
  const user = (routed.v.o.user)
    ? await routed.bot.DB.get<TrackedUser>('users', { $or: [{ id: String(ckUser.discordID) }, { 'ChastiKey.username': new RegExp(`^${ckUser.username}$`, 'i') }] })
    // Fallback: Create a mock record
    || (<TrackedUser>{ __notStored: true, ChastiKey: { username: ckUser.username, isVerified: false, ticker: { showStarRatingScore: true } } })
    // Else: Lookup the user by Discord ID
    : await routed.bot.DB.get<TrackedUser>('users', { id: routed.user.id })

  // Get current locks by user store in the collection
  const activeLocks = await routed.bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', { username: ckUser.username })
  // Get user from lockee data (Total locks, raitings, averages)
  const userInLockeeStats = new TrackedChastiKeyLockee(await routed.bot.DB.get<TrackedChastiKeyLockee>('ck-lockees', { username: usernameRegex }))

  // User has no data in the Lockee stats db
  // Causes
  //  - Have not opened the App in >=2 week
  if (!userInLockeeStats._hasDBData || ckUser._noData === true) {
    // Notify in chat what the issue could be
    await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeStatsMissing, { user: routed.v.o.user }))
    return true // Stop here
  }

  // Get all API locks
  const apiResponse: got.Response<TrackedChastiKeyUserAPIFetch> = await got(`${APIUrls.ChastiKey.ListLocks}?username=${user.ChastiKey.username}`, { json: true })
  var apiLockeeLocks = apiResponse.body.locks

  // Generate
  var compiledLockeeStats = Utils.ChastiKey.compileLockeeStats(ckUser, userInLockeeStats, activeLocks, apiLockeeLocks)

  // Add performance debug data to compiled stats
  compiledLockeeStats._performance = _performance

  await routed.message.channel.send(lockeeHistory(ckUser, { showRating: user.ChastiKey.ticker.showStarRatingScore }, compiledLockeeStats, apiLockeeLocks))
  return true
}
