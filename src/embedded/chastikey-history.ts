import * as Utils from '../utils'
import { TrackedChastiKeyUser, TrackedChastiKeyUserAPIFetchLock } from '../objects/chastikey'
import { LockeeStats } from './chastikey-stats'

export function lockeeHistory(user: TrackedChastiKeyUser, options: { showRating: boolean }, lockeeStatsCompiled: LockeeStats, apiLockeeLocks: Array<TrackedChastiKeyUserAPIFetchLock>, cachedTimestamp: number) {
  const threeMonthAgoTimestamp = ((Date.now() / 1000) - (7890000))
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
  apiLockeeLocks.forEach(lock => {
    // console.log(lock.lockedBy, sharedLockNoLongerManaged)
    const khIndexAlltime = stats.allTime.khNames.findIndex(name => name === lock.lockedBy)
    const khIndex3Months = stats.last3Months.khNames.findIndex(name => name === lock.lockedBy)
    const isLockAbandoned = lock.status === 'Locked' && lock.lockDeleted === 1
    const lockWasInLast3Months = (lock.timestampLocked >= threeMonthAgoTimestamp)
    const lockWasSelfLocked = (lock.lockedBy === '')
    const lockWasWithBot = (lock.lockedBy === 'Zoe' || lock.lockedBy === 'Chase' || lock.lockedBy === 'Blaine' || lock.lockedBy === 'Hailey')
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
    if (!isLockAbandoned && (lockLength) > stats.allTime.longestLock) stats.allTime.longestLock = lockLength
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
      if (!isLockAbandoned) { stats.last3Months.totalTimeLocked += ((lock.timestampUnlocked === 0) ? (Date.now() / 1000) : lockLength) }
      // [3 MONTHS] Ensure KH is tracked for count
      if (khIndex3Months === -1 && !isLockAbandoned) stats.last3Months.khNames.push(lock.lockedBy)
      // [ALLTIME] Longest lock
      if (!isLockAbandoned && (lockLength) > stats.last3Months.longestLock) stats.last3Months.longestLock = lockLength
    }
    // [3 MONTHS] Stats END
    // -----------------------------------------
  })

  // Remove duplicates
  stats.allTime.khNames = [...new Set(stats.allTime.khNames)]
  stats.last3Months.khNames = [...new Set(stats.last3Months.khNames)]

  // Compile body of message
  const dateJoinedDaysAgo = (lockeeStatsCompiled.joined !== '-')
    ? `(${Math.round((Date.now() - new Date(lockeeStatsCompiled.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)`
    : ''
  var description = ``
  description += `Joined \`${lockeeStatsCompiled.joined.substr(0, 10)}\` \`${dateJoinedDaysAgo}\`\n`
  // Only show the ratings if the user has > 5
  if (lockeeStatsCompiled.noOfRatings > 4 && options.showRating) description += `Avg Rating \`${lockeeStatsCompiled.averageRating}\` | # Ratings \`${lockeeStatsCompiled.noOfRatings}\`\n`
  // Reduced Non-Bot name listing of KH names
  const khNamesWithoutBots = stats.last3Months.khNames.filter(kh => kh !== 'Zoe' && kh !== 'Chase' && kh !== 'Blaine' && kh !== 'Hailey' && kh !== '')

  // Some buffer space for the stats from this command's output calculations
  description += `\n`

  description += `**All Time**\n`
  description += `Locked for \`${lockeeStatsCompiled.monthsLocked}\` __months__ to date¹\n`
  description += `Average \`${Math.round((stats.allTime.totalLocksCount / stats.allTime.khNames.length) * 100) / 100}\` __locks__ per Keyholder¹\n`
  description += `Average Time Locked per lock¹ \`${Utils.Date.calculateHumanTimeDDHHMM(lockeeStatsCompiled.averageLocked)}\`\n`
  description += `Longest (completed)¹ \`${Utils.Date.calculateHumanTimeDDHHMM(stats.allTime.longestLock)}\`\n`
  description += `\`${stats.allTime.totalLocksCount}\` __locks__ completed¹\n`
  description += `\`${stats.allTime.abandonedCount}\` __locks__ abandoned² ³\n`
  description += `\`${stats.allTime.khNames.length}\` Keyholders\n`
  // description += `\`${stats.allTime.selfLocks}\` Self Created Locks\n`
  // description += `\`${stats.allTime.selfLocks}\` Bot Keyholders\n`
  description += `\n`

  description += `**Last 3 months**\n`
  description += `Locked for \`${Math.round(stats.last3Months.totalTimeLocked / 60 / 60 / 24 * 100) / 100}\` __days__¹ ⁴\n`
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
      title: `${lockeeStatsCompiled.isVerified ? '<:verified:625628727820288000> ' : ''}\`${lockeeStatsCompiled.username}\` - ChastiKey Lockee Statistics - Historical View`,
      description: description,
      color: 9125611,
      timestamp: cachedTimestamp,
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `(${lockeeStatsCompiled.routerStats.performance}ms) Cached by Kiera`
      }
    }
  }

  const messageBlockStrLength = JSON.stringify(messageBlock).length
  console.log('Lockee block length:', messageBlockStrLength)
  return messageBlock

}

export function lockeeHistoryPersonal(user: TrackedChastiKeyUser, options: { showRating: boolean }, lockeeStatsCompiled: LockeeStats, apiLockeeLocks: Array<TrackedChastiKeyUserAPIFetchLock>, cachedTimestamp: number) {
  var fields: Array<{ name: string; value: string; }> = []
  var pastKeyholders: Array<{ name: string, timeLockedWith: number, numberOfLocks: number, abandonedLocks: number, lastTimeLocked: number }> = []
  // var locksUnlockedGt3MonthsAgoCount = 0
  // var locksUnlockedGt3MonthsAgoCumulative = 0
  // const sixMonthAgoTimestamp = ((Date.now() / 1000) - (7890000 * 2))

  // Calculate past KHs first
  apiLockeeLocks.forEach(lock => {
    const khIndex = pastKeyholders.findIndex(kh => kh.name === lock.lockedBy)
    const isLockAbandoned = lock.status === 'Locked' && lock.lockDeleted === 1
    // if (lock.lockedBy !== '') {
    // if (lock.timestampUnlocked > sixMonthAgoTimestamp || lock.timestampDeleted > sixMonthAgoTimestamp) {
    // When KH has already been found in a previously parsed lock
    if (khIndex > -1) {
      // Abandoned Lock
      if (isLockAbandoned) { pastKeyholders[khIndex].abandonedLocks += 1 }
      // Increment total count
      pastKeyholders[khIndex].numberOfLocks += 1
      // Track time of locked only on unlocked locks
      if (lock.status === 'UnlockedReal') { pastKeyholders[khIndex].timeLockedWith += (lock.timestampUnlocked - lock.timestampLocked) }
      // Track last locked timestamp with this kh
      pastKeyholders[khIndex].lastTimeLocked = (pastKeyholders[khIndex].timeLockedWith < lock.timestampLocked) ? lock.timestampLocked : pastKeyholders[khIndex].timeLockedWith
    }
    // New KH to collection
    else {
      pastKeyholders.push({
        name: lock.lockedBy === '' ? '<Self>' : lock.lockedBy,
        timeLockedWith: (lock.status === 'UnlockedReal') ? (lock.timestampUnlocked - lock.timestampLocked) : 0,
        numberOfLocks: 1,
        abandonedLocks: isLockAbandoned ? 1 : 0,
        lastTimeLocked: lock.timestampLocked
      })
    }
    // }
    // else {
    // locksUnlockedGt3MonthsAgoCount += 1
    // locksUnlockedGt3MonthsAgoCumulative += (lock.timestampUnlocked - lock.timestampLocked)
    // }
  })

  // Sort A < Z
  pastKeyholders.sort((a, b) => {
    var x = a.name;
    var y = b.name;
    if (x < y) { return -1; }
    if (x > y) { return 1; }
    return 0;
  })

  pastKeyholders.forEach((l, i) => {
    if (i > 10) return // Skip, there can only be 20 locks in the db, this means theres an issue server side
    fields.push(pastKHStatsEntry(i, l, fields.length))
  })

  // When no locks are active, add a different field to indicate this
  if (fields.length === 0) {
    fields.push({
      name: 'No past locks',
      value: `To see any additional stats a lock must have been active.`
    })
  }

  // // Add an additionl field for locksUnlockedGt3MonthsAgoCount
  // if (locksUnlockedGt3MonthsAgoCount > 0) {
  //   fields.push({
  //     name: '**Locks Unlocked > 3 Months ago**',
  //     value: `# locks: \`${locksUnlockedGt3MonthsAgoCount}\`\n# Total time: \`${Utils.Date.calculateHumanTimeDDHHMM(locksUnlockedGt3MonthsAgoCumulative)}\``
  //   })
  // }

  var dateJoinedDaysAgo = (lockeeStatsCompiled.joined !== '-')
    ? `(${Math.round((Date.now() - new Date(lockeeStatsCompiled.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)`
    : ''
  var description = `Locked for \`${lockeeStatsCompiled.monthsLocked}\` months to date | \`${lockeeStatsCompiled.totalNoOfCompletedLocks}\` locks completed`
  // Only show the ratings if the user has > 5
  if (lockeeStatsCompiled.noOfRatings > 4 && options.showRating) description += ` | Avg Rating \`${lockeeStatsCompiled.averageRating}\` | # Ratings \`${lockeeStatsCompiled.noOfRatings}\``
  description += `\nLongest (completed) \`${Utils.Date.calculateHumanTimeDDHHMM(lockeeStatsCompiled.longestLock)}\` | Average Time Locked (overall) \`${Utils.Date.calculateHumanTimeDDHHMM(lockeeStatsCompiled.averageLocked)}\``
  description += `\nJoined \`${lockeeStatsCompiled.joined.substr(0, 10)}\` ${dateJoinedDaysAgo}`

  // Embed Message Block
  const messageBlock = {
    embed: {
      title: `${lockeeStatsCompiled.isVerified ? '<:verified:625628727820288000> ' : ''}\`${lockeeStatsCompiled.username}\` - ChastiKey Lockee Statistics - Historical View`,
      description: description,
      color: 9125611,
      timestamp: cachedTimestamp,
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `* This does not include time of abandoned locks or active running locks - (${lockeeStatsCompiled.routerStats.performance}ms) Cached by Kiera`
      },
      fields: fields,
    }
  }

  const messageBlockStrLength = JSON.stringify(messageBlock).length
  console.log('Lockee block length:', messageBlockStrLength)
  return messageBlock

}

function pastKHStatsEntry(index: number, kh: { name: string, timeLockedWith: number, numberOfLocks: number, abandonedLocks: number }, numberOfFields: number) {
  // Calculate human readible time for lock from seconds
  const combined = Utils.Date.calculateHumanTimeDDHHMM(kh.timeLockedWith)
  var value = `# locks with: \`${kh.numberOfLocks}\`\n# abandoned with: \`${kh.abandonedLocks}\`\nTotal time*: \`${combined}\``

  return {
    name: `**Keyholder: \`${kh.name}\`**`,
    value: value
  }
}