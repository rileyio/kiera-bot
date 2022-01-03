import * as Utils from '@/utils'

import { KeyholderData } from 'chastikey.js/app/objects'
import { RouterStats } from '@/router'
import { TrackedKeyholderLockeesStatistics } from '@/commands/chastikey/shared'

export function keyholderStats(
  keyholderData: KeyholderData,
  activeLocks: Array<TrackedKeyholderLockeesStatistics>,
  cachedTimestamp: number,
  routerStats: RouterStats,
  options: { showRating: boolean; showAverage: boolean }
) {
  const dateJoinedDaysAgo = keyholderData.joined !== '-' ? `(${Math.round((Date.now() - new Date(keyholderData.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)` : ''

  const dateRearrangedYYYY = keyholderData.dateFirstKeyheld.substr(6, 4)
  const dateRearrangedMM = keyholderData.dateFirstKeyheld.substr(3, 2)
  const dateRearrangedDD = keyholderData.dateFirstKeyheld.substr(0, 2)
  const dateFormatted = new Date(`${dateRearrangedYYYY}-${dateRearrangedMM}-${dateRearrangedDD}`)
  const dateFirstKHAgo = keyholderData.joined !== '-' ? `(${Math.round((Date.now() - dateFormatted.getTime()) / 1000 / 60 / 60 / 24)} days ago)` : ''
  const lockLookedAt: Array<number> = []
  const dateRearranged = `${dateRearrangedYYYY}-${dateRearrangedMM}-${dateRearrangedDD}`
  const individualLockStats: Array<{ name: string; count: number; fixed: boolean; cumulative: boolean }> = []
  let description = ``
  let lockCount = 0
  let cumulativeTimelocked = 0
  let numberOfFixed = 0
  let numberOfVar = 0
  let numberOfTurns = 0

  activeLocks.forEach((l) => {
    // Add to avg and count for calculation
    const locksTotal = l.locks.reduce((currentVal, lock) => {
      if (lockLookedAt.findIndex((li) => li === lock.secondsLocked) === -1) {
        lockLookedAt.push(lock.secondsLocked)
        // Count lock types & other cumulatives
        numberOfVar += !lock.fixed ? 1 : 0
        numberOfFixed += lock.fixed ? 1 : 0
        numberOfTurns += !lock.fixed ? lock.noOfTurns : 0

        // Track individual lock stats
        if (individualLockStats.findIndex((_l) => _l.name === lock.sharedLockName) === -1) {
          individualLockStats.push({ count: 1, cumulative: lock.cumulative, fixed: lock.fixed, name: lock.sharedLockName })
        } else {
          individualLockStats.find((_l) => _l.name === lock.sharedLockName).count += 1
        }

        // Only look at if the value is a positive value (to skip over problem causing values)
        if (lock.secondsLocked >= 0) {
          return currentVal + lock.secondsLocked
        }
      }

      return currentVal
    }, 0)

    lockCount += 1
    cumulativeTimelocked += locksTotal
  })

  // Sort locks by most to least lockees
  individualLockStats.sort((a, b) => {
    const x = a.count
    const y = b.count
    if (x > y) {
      return -1
    }
    if (x < y) {
      return 1
    }
    return 0
  })

  if (keyholderData.noOfRatings > 4 && options.showRating) description += `Avg Rating **\`${keyholderData.averageRating}\`** | # Ratings **\`${keyholderData.noOfRatings}\`**\n`
  description += `# of Users Locked **\`${keyholderData.noOfLocksManagingNow}\`**\n`
  description += `# of Locks Flagged As Trusted **\`${keyholderData.noOfLocksFlaggedAsTrusted}\`** <:trustkeyholder:474975187310346240>\n`
  description += `# of Shared Locks **\`${keyholderData.noOfSharedLocks}\`**\nTotal Locks Managed **\`${keyholderData.totalLocksManaged}\`**\n`
  description += `Joined \`${keyholderData.joined.substr(0, 10)}\` ${dateJoinedDaysAgo}\n`
  description += `Date first keyheld \`${dateRearranged}\` ${dateFirstKHAgo}\n`
  description += `App Version \`${keyholderData.versionInstalled}\` Build \`${keyholderData.buildNumberInstalled}\`\n`
  if (keyholderData.discordID) description += `Verified to ${Utils.User.buildUserChatAt(keyholderData.discordID, Utils.User.UserRefType.snowflake)}\n`
  if (keyholderData.twitterUsername) description += `Twitter \`${keyholderData.twitterUsername}\`\n`

  description += `\n**Stats** (Running Locks)\n`
  if (options.showAverage) description += `Average Time of Locks \`${lockCount > 1 ? Utils.Date.calculateHumanTimeDDHHMM(cumulativeTimelocked / lockCount) : '00d 00h 00m'}\`\n`
  description += `Cumulative Time Locked \`${Utils.Date.calculateHumanTimeDDHHMM(cumulativeTimelocked)}\`\n`
  description += `Number of Fixed Locks \`${numberOfFixed}\`\n`
  description += `Number of Variable Locks \`${numberOfVar}\`\n`
  description += `Number of Turns (variable) \`${numberOfTurns}\`\n\n`

  // For each lock
  description += `**Locks** (Running Locks)\n`
  if (lockCount > 0)
    individualLockStats.forEach((lock) => (description += `\`${lock.count}\` ${lock.name || `<No Name>`} \`[${lock.fixed ? 'F' : 'V'}]\` \`[${lock.cumulative ? 'C' : 'NC'}]\`\n`))
  else {
    description += `No active locks to display!`
  }

  return {
    color: 9125611,
    description: description,
    footer: {
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
    },
    timestamp: cachedTimestamp,
    title: `${keyholderData.isVerified ? '<:verified:625628727820288000> ' : ''}\`${keyholderData.username}\` - ChastiKey Keyholder Statistics`
  }
}