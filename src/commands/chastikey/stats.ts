import got = require('got');
import * as Utils from '../../utils'
import { RouterRouted } from '../../utils';
import { lockeeStats, keyholderStats } from '../../embedded/chastikey-stats';
import { TrackedUser } from '../../objects/user';
import { TrackedChastiKeyLock, TrackedChastiKeyUserAPIFetch, TrackedChastiKeyLockee, TrackedChastiKeyUserTotalLockedTime, TrackedKeyholderStatistics } from '../../objects/chastikey';
import { performance } from 'perf_hooks';

export async function getLockeeStats(routed: RouterRouted) {
  // // If user fails to pass a type to return, inform them
  // if (routed.v.o.type !== 'lockee' && routed.v.o.type !== 'keyholder') {
  //   await routed.message.reply(Utils.sb(Utils.en.chastikey.lockeeOrKeyholderRequired))
  //   return false // Stop here
  // }
  var _performance = {
    start: performance.now(),
    end: undefined
  }

  // Get user's current ChastiKey username from users collection or by the override
  const user = (routed.v.o.user)
    ? { ChastiKey: { username: routed.v.o.user } }
    : await routed.bot.DB.get<TrackedUser>('users', { id: routed.message.author.id })
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
  const userFromAPIresp = await got(`https://api.chastikey.com/v0.2/listlocks.php?username=${user.ChastiKey.username}&bot=Kiera`, { json: true })
  const userFromAPI: TrackedChastiKeyUserAPIFetch = userFromAPIresp.body

  // console.log(activeLocks)
  // console.log(userInLockeeStats)
  // console.log(userInLockeeTotals)
  // console.log(userFromAPIresp.body)

  // Map keyholders from User API -> Active locks
  activeLocks.map(lock => {
    // Find matching lock from API user's locks
    const matchingAPILock = userFromAPI.locks.find(apiLock => apiLock.lockID === lock.timestampLocked)
    // Map KH name into locks data
    lock.keyholder = matchingAPILock.lockedBy
    // Finished mapping
    return lock
  })
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
  }))
}

export async function getKeyholderStats(routed: RouterRouted) {
  // Get user's current ChastiKey username from users collection or by the override
  const user = (routed.v.o.user)
    ? { ChastiKey: { username: routed.v.o.user } }
    : await routed.bot.DB.get<TrackedUser>('users', { id: routed.message.author.id })
  // If user does not have a ChastiKey username set, warn them
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

  await routed.message.channel.send(keyholderStats(keyholder))
}