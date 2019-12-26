import * as Utils from '../utils'
import { RouterStats } from '@/router'
import { LockeeDataResponse } from 'chastikey.js/app/objects'

export function lockeeHistory(lockeeData: LockeeDataResponse, options: { showRating: boolean }, routerStats: RouterStats) {
  const threeMonthAgoTimestamp = Date.now() / 1000 - 7890000
  var stats = {
    allTime: {
      avgLockedTimePerKH: 0.0,
      abandonedCount: 0,
      totalLocksCount: 0,
      totalTimeLocked: 0,
      selfLocks: 0,
      shareLockNoLongerManaged: 0,
      khNames: [],
      longestLock: 0
    },
    last3Months: {
      avgLockedTimePerKH: 0.0,
      abandonedCount: 0,
      totalLocksCount: 0,
      totalTimeLocked: 0,
      selfLocks: 0,
      shareLockNoLongerManaged: 0,
      khNames: [],
      longestLock: 0
    }
  }

  // Calculate past KHs first
  lockeeData.locks.forEach(lock => {
    // console.log(lock.lockedBy, sharedLockNoLongerManaged)
    const khIndexAlltime = stats.allTime.khNames.findIndex(name => name === lock.lockedBy)
    const khIndex3Months = stats.last3Months.khNames.findIndex(name => name === lock.lockedBy)
    const isLockAbandoned = lock.status === 'Locked' && lock.deleted === 1
    const lockWasInLast3Months = lock.timestampLocked >= threeMonthAgoTimestamp
    const lockWasSelfLocked = lock.lockedBy === ''
    const lockWasWithBot = lock.lockedBy === 'Zoe' || lock.lockedBy === 'Chase' || lock.lockedBy === 'Blaine' || lock.lockedBy === 'Hailey'
    const lockLength = lock.timestampUnlocked - lock.timestampLocked

    // -----------------------------------------
    // [ALLTIME] Stats START
    // [ALLTIME] Increment total count
    if (!isLockAbandoned) stats.allTime.totalLocksCount += 1
    if (lockWasSelfLocked) stats.allTime.selfLocks += 1
    // [ALLTIME] Increment Abandoned count
    // Only include Shared Locks, I.E. No self locks
    if (isLockAbandoned && !lockWasSelfLocked && !lockWasWithBot) stats.allTime.abandonedCount += 1
    // [ALLTIME] Ensure KH is tracked for count
    if (khIndexAlltime === -1 && !isLockAbandoned) stats.allTime.khNames.push(lock.lockedBy)
    // [ALLTIME] Longest lock
    if (!isLockAbandoned && lockLength > stats.allTime.longestLock) stats.allTime.longestLock = lockLength
    // [ALLTIME] Stats END
    // -----------------------------------------
    // -----------------------------------------
    // [3 MONTHS] Stats START
    if (lockWasInLast3Months) {
      // [3 MONTHS] Increment total count
      if (!isLockAbandoned) stats.last3Months.totalLocksCount += 1
      if (lockWasSelfLocked) stats.last3Months.selfLocks += 1
      // [3 MONTHS] Increment Abandoned count
      // Only include Shared Locks, I.E. No self locks
      if (isLockAbandoned && !lockWasSelfLocked && !lockWasWithBot) stats.last3Months.abandonedCount += 1
      // [3 MONTHS] Increment total locked time (Excluding: Abandoned locks)
      if (!isLockAbandoned) {
        stats.last3Months.totalTimeLocked += lock.timestampUnlocked === 0 ? (Date.now() / 1000) - lock.timestampLocked : lockLength
      }
      // [3 MONTHS] Ensure KH is tracked for count
      if (khIndex3Months === -1 && !isLockAbandoned) stats.last3Months.khNames.push(lock.lockedBy)
      // [ALLTIME] Longest lock
      if (!isLockAbandoned && lockLength > stats.last3Months.longestLock) stats.last3Months.longestLock = lockLength
    }
    // [3 MONTHS] Stats END
    // -----------------------------------------
  })

  // Remove duplicates
  stats.allTime.khNames = [...new Set(stats.allTime.khNames)]
  stats.last3Months.khNames = [...new Set(stats.last3Months.khNames)]

  // Compile body of message
  const dateJoinedDaysAgo = lockeeData.data.joined !== '-' ? `(${Math.round((Date.now() - new Date(lockeeData.data.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)` : ''
  var description = ``
  description += `Joined \`${lockeeData.data.joined.substr(0, 10)}\` \`${dateJoinedDaysAgo}\`\n`
  // Only show the ratings if the user has > 5
  if (lockeeData.data.noOfRatings > 4 && options.showRating) description += `Avg Rating \`${lockeeData.data.averageRating}\` | # Ratings \`${lockeeData.data.noOfRatings}\`\n`
  // Reduced Non-Bot name listing of KH names
  const khNamesWithoutBots = stats.last3Months.khNames.filter(kh => kh !== 'Zoe' && kh !== 'Chase' && kh !== 'Blaine' && kh !== 'Hailey' && kh !== '')

  // Some buffer space for the stats from this command's output calculations
  description += `\n`

  description += `**All Time**\n`
  description += `Locked for \`${Math.round((lockeeData.data.cumulativeSecondsLocked / 2592000) * 100) / 100}\` __months__ to date¹\n`
  description += `Average \`${Math.round((stats.allTime.totalLocksCount / stats.allTime.khNames.length) * 100) / 100}\` __locks__ per Keyholder¹\n`
  description += `Average Time Locked per lock¹ \`${Utils.Date.calculateHumanTimeDDHHMM(lockeeData.data.averageTimeLockedInSeconds)}\`\n`
  description += `Longest (completed)¹ \`${Utils.Date.calculateHumanTimeDDHHMM(lockeeData.data.longestCompletedLockInSeconds)}\`\n`
  description += `\`${stats.allTime.totalLocksCount}\` __locks__ completed¹\n`
  description += `\`${stats.allTime.abandonedCount}\` __locks__ abandoned² ³\n`
  description += `\`${stats.allTime.khNames.length}\` Keyholders\n`
  // description += `\`${stats.allTime.selfLocks}\` Self Created Locks\n`
  // description += `\`${stats.allTime.selfLocks}\` Bot Keyholders\n`
  description += `\n`

  description += `**Last 3 months**\n`
  description += `Locked for \`${Math.round((stats.last3Months.totalTimeLocked / 60 / 60 / 24) * 100) / 100}\` __days__¹ ⁴\n`
  description += `Average \`${Math.round((stats.last3Months.totalLocksCount / stats.last3Months.khNames.length) * 100) / 100}\` __locks__ per Keyholder¹\n`
  description += `Longest (completed)¹ \`${Utils.Date.calculateHumanTimeDDHHMM(stats.last3Months.longestLock)}\`\n`
  description += `\`${stats.last3Months.totalLocksCount}\` __locks__ completed¹\n`
  description += `\`${stats.last3Months.abandonedCount}\` __locks__ abandoned² ³\n`
  description += `\`${stats.last3Months.khNames.length}\` Keyholders\n`
  description += `Non-Bot/Self Keyholders \`\`\`${khNamesWithoutBots.join(', ')}\`\`\`\n`
  // description += `\`${stats.last3Months.selfLocks}\` Self Created Locks\n`
  // description += `\`${stats.last3Months.selfLocks}\` Bot Keyholders\n`
  description += `\n`

  description += `¹ Does not include abandoned locks.\n`
  description += `² Does not include self locks.\n`
  description += `³ Does not include bot locks.\n`
  description += `⁴ Does not exclude overlaps at this time.\n`

  // Embed Message Block
  const messageBlock = {
    embed: {
      title: `${lockeeData.data.discordID ? '<:verified:625628727820288000> ' : ''}\`${lockeeData.data.username}\` - ChastiKey Lockee Statistics - Historical View`,
      description: description,
      color: 9125611,
      timestamp: Date.now(),
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `(${routerStats.performance}ms) Cached by Kiera`
      }
    }
  }

  const messageBlockStrLength = JSON.stringify(messageBlock).length
  console.log('Lockee block length:', messageBlockStrLength)
  return messageBlock
}
