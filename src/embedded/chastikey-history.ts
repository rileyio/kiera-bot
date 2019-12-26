import * as Utils from '../utils'
import { RouterStats } from '@/router'
import { LockeeDataResponse } from 'chastikey.js/app/objects'

export function lockeeHistory(lockeeData: LockeeDataResponse, options: { showRating: boolean }, routerStats: RouterStats) {
  const twelveMonthAgoTimestamp = Date.now() / 1000 - 7890000 * 4
  const threeMonthAgoTimestamp = Date.now() / 1000 - 7890000
  var stats = {
    last12Months: {
      avgLockedTimePerKH: 0.0,
      abandonedCount: 0,
      totalLocksCount: 0,
      totalTimeLocked: 0,
      selfLocks: 0,
      botLocks: 0,
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
      botLocks: 0,
      shareLockNoLongerManaged: 0,
      khNames: [],
      longestLock: 0
    }
  }

  // Calculate past KHs first
  lockeeData.locks.forEach(lock => {
    // console.log(lock.lockedBy, sharedLockNoLongerManaged)
    const khIndex12Months = stats.last12Months.khNames.findIndex(name => name === lock.lockedBy)
    const khIndex3Months = stats.last3Months.khNames.findIndex(name => name === lock.lockedBy)
    const isLockAbandoned = (lock.status === 'Locked') && lock.deleted === 1
    const lockWasInLast12Months = lock.timestampLocked >= twelveMonthAgoTimestamp
    const lockWasInLast3Months = lock.timestampLocked >= threeMonthAgoTimestamp
    const lockWasSelfLocked = lock.lockedBy === '' || lock.lockedBy === lockeeData.data.username
    const lockWasWithBot = lock.lockedBy === 'Zoe' || lock.lockedBy === 'Chase' || lock.lockedBy === 'Blaine' || lock.lockedBy === 'Hailey'
    const lockLength = lock.timestampUnlocked - lock.timestampLocked

    if (lockWasInLast12Months) {
      // -----------------------------------------
      // [12 MONTHS] Stats START
      // [12 MONTHS] Increment total locks count
      // *Excludes: Abandoned, Self, Bots
      if (!isLockAbandoned && !lockWasSelfLocked && !lockWasWithBot) stats.last12Months.totalLocksCount += 1
      // [12 MONTHS] Increment Self locks count
      // *Excludes: Abandoned
      if (!isLockAbandoned && lockWasSelfLocked) stats.last12Months.selfLocks += 1
      // [12 MONTHS] Increment Bot locks count
      // *Excludes: Abandoned
      if (!isLockAbandoned && lockWasWithBot) stats.last12Months.botLocks += 1
      // [12 MONTHS] Increment Abandoned count
      // *Excludes: Self, Bots
      if (isLockAbandoned && !lockWasSelfLocked && !lockWasWithBot) stats.last12Months.abandonedCount += 1
      // [3 MONTHS] Increment total locked time
      // *Excludes: Abandoned, Self, Bots
      if (!isLockAbandoned && !lockWasSelfLocked && !lockWasWithBot) stats.last12Months.totalTimeLocked += lock.timestampUnlocked === 0 ? Date.now() / 1000 - lock.timestampLocked : lockLength
      // [12 MONTHS] Ensure KH is tracked for count
      // *Excludes: Self, Bots
      if (khIndex12Months === -1 && !lockWasSelfLocked && !lockWasWithBot) stats.last12Months.khNames.push(lock.lockedBy)
      // [12 MONTHS] Longest lock
      // *Excludes: Abandoned, Self, Bots
      if (!isLockAbandoned && lockLength > stats.last12Months.longestLock && !lockWasSelfLocked && !lockWasWithBot) stats.last12Months.longestLock = lockLength
      // [12 MONTHS] Stats END
      // -----------------------------------------
      // -----------------------------------------
      // [3 MONTHS] Stats START
      // if (lockWasInLast3Months) {
      //   // [3 MONTHS] Increment total count
      //   // *Excludes: Abandoned, Self, Bots
      //   if (!isLockAbandoned && !lockWasSelfLocked && !lockWasWithBot) stats.last3Months.totalLocksCount += 1
      //   // [3 MONTHS] Increment Self locks count
      //   // *Excludes: Abandoned
      //   if (!isLockAbandoned && lockWasSelfLocked) stats.last3Months.selfLocks += 1
      //   // [3 MONTHS] Increment Bot locks count
      //   // *Excludes: Abandoned
      //   if (!isLockAbandoned && lockWasWithBot) stats.last3Months.botLocks += 1
      //   // [3 MONTHS] Increment Abandoned count
      //   // *Excludes: Self, Bots
      //   if (isLockAbandoned && !lockWasSelfLocked && !lockWasWithBot) stats.last3Months.abandonedCount += 1
      //   // [3 MONTHS] Increment total locked time
      //   // *Excludes: Abandoned, Self, Bots
      //   if (!isLockAbandoned && !lockWasSelfLocked && !lockWasWithBot) stats.last3Months.totalTimeLocked += lock.timestampUnlocked === 0 ? Date.now() / 1000 - lock.timestampLocked : lockLength
      //   // [3 MONTHS] Ensure KH is tracked for count
      //   // *Excludes: Self, Bots
      //   if (khIndex3Months === -1 && !lockWasSelfLocked && !lockWasWithBot) stats.last3Months.khNames.push(lock.lockedBy)
      //   // [3 MONTHS] Longest lock
      //   // *Excludes: Abandoned, Self, Bots
      //   if (!isLockAbandoned && lockLength > stats.last3Months.longestLock && !lockWasSelfLocked && !lockWasWithBot) stats.last3Months.longestLock = lockLength
      // }
      // [3 MONTHS] Stats END
      // -----------------------------------------
    }
  })

  // Remove duplicates
  stats.last12Months.khNames = [...new Set(stats.last12Months.khNames)]
  stats.last3Months.khNames = [...new Set(stats.last3Months.khNames)]

  // Compile body of message
  const dateJoinedDaysAgo = lockeeData.data.joined !== '-' ? `(${Math.round((Date.now() - new Date(lockeeData.data.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)` : ''
  var description = ``
  description += `Joined \`${lockeeData.data.joined.substr(0, 10)}\` \`${dateJoinedDaysAgo}\`\n`
  // Only show the ratings if the user has > 5
  if (lockeeData.data.noOfRatings > 4 && options.showRating) description += `Avg Rating \`${lockeeData.data.averageRating}\` | # Ratings \`${lockeeData.data.noOfRatings}\`\n`
  // Reduced Non-Bot name listing of KH names
  // const khNamesWithoutBotsAll = stats.last12Months.khNames.filter(kh => kh !== 'Zoe' && kh !== 'Chase' && kh !== 'Blaine' && kh !== 'Hailey' && kh !== '')
  // const khNamesWithoutBots3Mo = stats.last3Months.khNames.filter(kh => kh !== 'Zoe' && kh !== 'Chase' && kh !== 'Blaine' && kh !== 'Hailey' && kh !== '')

  // Some buffer space for the stats from this command's output calculations
  description += `\n`

  description += `**Last 12 months**\n`
  description += `Locked for \`${Math.round((stats.last12Months.totalTimeLocked / 60 / 60 / 24) * 100) / 100}\` __days__¹ ⁴\n`
  description += `Average \`${Math.round((stats.last12Months.totalLocksCount / stats.last12Months.khNames.length) * 100) / 100}\` __locks__ per Keyholder¹ ⁴\n`
  description += `Longest (completed)¹ \`${Utils.Date.calculateHumanTimeDDHHMM(stats.last12Months.longestLock)}\`\n`
  description += `\`${stats.last12Months.totalLocksCount}\` Keyholder __locks__ completed¹\n`
  description += `\`${stats.last12Months.botLocks}\` Bot __locks__ completed²\n`
  description += `\`${stats.last12Months.selfLocks}\` Self __locks__ completed²\n`
  description += `\`${stats.last12Months.abandonedCount}\` Keyholder __locks__ abandoned³\n`
  description += `\`${stats.last12Months.khNames.length}\` Keyholders¹\n`
  description += `\`\`\`${stats.last12Months.khNames.join(', ')}\`\`\`\n`
  // description += `\`${stats.last12Months.selfLocks}\` Self Created Locks\n`
  // description += `\`${stats.last12Months.selfLocks}\` Bot Keyholders\n`
  description += `\n`

  // description += `**Last 3 months**\n`
  // description += `Locked for \`${Math.round((stats.last3Months.totalTimeLocked / 60 / 60 / 24) * 100) / 100}\` __days__¹ ⁴\n`
  // description += `Average \`${Math.round((stats.last3Months.totalLocksCount / stats.last3Months.khNames.length) * 100) / 100}\` __locks__ per Keyholder¹ ⁴\n`
  // description += `Longest (completed)¹ \`${Utils.Date.calculateHumanTimeDDHHMM(stats.last3Months.longestLock)}\`\n`
  // description += `\`${stats.last3Months.totalLocksCount}\` Keyholder __locks__ completed¹\n`
  // description += `\`${stats.last3Months.botLocks}\` Bot __locks__ completed²\n`
  // description += `\`${stats.last3Months.selfLocks}\` Self __locks__ completed²\n`
  // description += `\`${stats.last3Months.abandonedCount}\` Keyholder __locks__ abandoned³\n`
  // description += `\`${stats.last3Months.khNames.length}\` Keyholders¹\n`
  // description += `\`\`\`${stats.last3Months.khNames.join(', ')}\`\`\`\n`
  // // description += `\`${stats.last3Months.selfLocks}\` Self Created Locks\n`
  // // description += `\`${stats.last3Months.selfLocks}\` Bot Keyholders\n`
  // description += `\n`

  description += `¹ Excludes: Abandoned, Self, Bots.\n`
  description += `² Excludes: Abandoned.\n`
  description += `³ Excludes: Self, Bots.\n`
  description += `⁴ Does not exclude overlaps at this time.\n`
  description += `Only includes locks where they started in the last 12 months\n`

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
