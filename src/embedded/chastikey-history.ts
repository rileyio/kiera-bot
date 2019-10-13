import * as Utils from '../utils'
import { TrackedChastiKeyUser, TrackedChastiKeyUserAPIFetchLock } from '../objects/chastikey'
import { LockeeStats } from './chastikey-stats'
import { performance } from 'perf_hooks'

export function lockeeHistory(user: TrackedChastiKeyUser, options: { showRating: boolean }, lockeeStatsCompiled: LockeeStats, apiLockeeLocks: Array<TrackedChastiKeyUserAPIFetchLock>) {
  var fields: Array<{ name: string; value: string; }> = []
  var pastKeyholders: Array<{ name: string, timeLockedWith: number, numberOfLocks: number, abandonedLocks: number, lastTimeLocked: number }> = []
  var locksUnlockedGt3MonthsAgoCount = 0
  var locksUnlockedGt3MonthsAgoCumulative = 0
  const threeMonthAgoTimestamp = ((Date.now() / 1000) - (7890000))

  // Calculate past KHs first
  apiLockeeLocks.forEach(lock => {
    const khIndex = pastKeyholders.findIndex(kh => kh.name === lock.lockedBy)
    const isLockAbandoned = lock.status === 'Locked' && lock.lockDeleted === 1
    // if (lock.lockedBy !== '') {
    if (lock.timestampUnlocked > threeMonthAgoTimestamp || lock.timestampDeleted > threeMonthAgoTimestamp) {
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
    }
    else {
      locksUnlockedGt3MonthsAgoCount += 1
      locksUnlockedGt3MonthsAgoCumulative += (lock.timestampUnlocked - lock.timestampLocked)
    }
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

  // Add an additionl field for locksUnlockedGt3MonthsAgoCount
  if (locksUnlockedGt3MonthsAgoCount > 0) {
    fields.push({
      name: '**Locks Unlocked > 3 Months ago**',
      value: `# locks: \`${locksUnlockedGt3MonthsAgoCount}\`\n# Total time: \`${Utils.Date.calculateHumanTimeDDHHMM(locksUnlockedGt3MonthsAgoCumulative)}\``
    })
  }

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
      title: `${lockeeStatsCompiled._isVerified ? '<:verified:625628727820288000> ' : ''}\`${lockeeStatsCompiled.username}\` - ChastiKey Lockee Statistics - Historical View`,
      description: description,
      color: 9125611,
      timestamp: (lockeeStatsCompiled.cacheTimestamp) ? new Date((<number>lockeeStatsCompiled.cacheTimestamp) * 1000).toISOString() : '',
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `* This does not include time of abandoned locks or active running locks - (${Math.round(performance.now() - lockeeStatsCompiled._performance.start)}ms) Cached by Kiera`
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