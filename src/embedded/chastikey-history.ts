import * as Utils from '../utils'
import { TrackedChastiKeyUser, TrackedChastiKeyUserAPIFetchLock } from '../objects/chastikey'
import { LockeeStats } from './chastikey-stats'
import { performance } from 'perf_hooks'

export function lockeeHistory(user: TrackedChastiKeyUser, options: { showRating: boolean }, lockeeStatsCompiled: LockeeStats, apiLockeeLocks: Array<TrackedChastiKeyUserAPIFetchLock>) {
  var fields: Array<{ name: string; value: string; }> = []
  var pastKeyholders: Array<{ name: string, timeLockedWith: number, numberOfLocks: number, abandonedLocks: number }> = []

  // Calculate past KHs first
  apiLockeeLocks.forEach(lock => {
    const khIndex = pastKeyholders.findIndex(kh => kh.name === lock.lockedBy || kh.name === 'Unknown (KH\'s Lock has since been deleted)')
    const isLockAbandoned = lock.status === 'Locked' && lock.lockDeleted === 1
    // When KH has already been found in a previously parsed lock
    if (khIndex > -1) {
      // Abandoned Lock
      if (isLockAbandoned) { pastKeyholders[khIndex].abandonedLocks += 1 }
      // Increment total count
      pastKeyholders[khIndex].numberOfLocks += 1
      // Track time of locked only on unlocked locks
      if (lock.status === 'UnlockedReal') { pastKeyholders[khIndex].timeLockedWith += (lock.timestampUnlocked - lock.timestampLocked) }
    }
    // New KH to collection
    else {
      pastKeyholders.push({
        name: lock.lockedBy !== 'Shared lock no longer managed by keyholder' ? lock.lockedBy : 'Unknown (KH\'s Lock has since been deleted)',
        timeLockedWith: (lock.status === 'UnlockedReal') ? (lock.timestampUnlocked - lock.timestampLocked) : 0,
        numberOfLocks: 1,
        abandonedLocks: isLockAbandoned ? 1 : 0
      })
    }
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
  var value = `\`\`\``
  value += `Number of locks with:            ${kh.numberOfLocks}\n`
  value += `Number of abandoned locks with:  ${kh.abandonedLocks}\n`
  value += `Total time locked with*:         ${combined}`
  value += `\`\`\``

  return {
    name: `Keyholder: \`${kh.name}\``,
    value: value
  }
}