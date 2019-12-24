import { TrackedChastiKeyKeyholderStatistics } from '@/objects/chastikey'
import * as Utils from '@/utils'
import { RouterStats } from '@/router'
import { LockeeDataLock, LockeeDataResponse } from 'chastikey.js/app/objects'

export interface TrackedSharedKeyholderStatistics {
  _id: string
  keyholders: Array<string>
  count: number
  uniqueKHCount: number
}

export interface TrackedKeyholderLockeesStatistics {
  _id: string
  locks: Array<{
    fixed: boolean
    timer_hidden: boolean
    lock_frozen_by_keyholder: boolean
    lock_frozen_by_card: boolean
    keyholder: string
    secondsLocked: number
    noOfTurns: number
    sharedLockName: string
  }>
}

const indicatorEmoji = {
  Frozen: `<:frozenlock:539233483537645568>`,
  Hidden: `<:hiddencircle:474973202607767562>`
}

const cardsEmoji = {
  Yellow: `<:10:601169212370583553>`,
  YellowMinus2: `<:12:601169259107713045>`,
  YellowMinus1: `<:11:601169242859110436>`,
  YellowAdd3: `<:9_:601169195744362516>`,
  YellowAdd2: `<:8_:601169176651890700>`,
  YellowAdd1: `<:7_:601169162370416640>`,
  Reset: `<:6_:601169148843917322>`,
  Red: `<:5_:601169109954330635>`,
  GoAgain: '<:2_:601169068837568542>',
  Green: `<:3_:601169082066141238>`,
  DoubleUp: `<:4_:601169095982841856>`,
  Freeze: `<:1_:601169050294419476>`
}

export function lockeeStats(lockeeData: LockeeDataResponse, options: { showRating: boolean }, routerStats: RouterStats) {
  var fields: Array<{ name: string; value: string }> = []

  lockeeData.getLocked.forEach((l, i) => {
    if (i > 19) return // Skip, there can only be 20 locks in the db, this means theres an issue server side
    fields.push(lockEntry(i, l, fields.length))
  })

  // When no locks are active, add a different field to indicate this
  if (fields.length === 0) {
    fields.push({
      name: 'No active locks',
      value: `To see any additional stats a lock must be active.\n Time Since Last Lock \`${Utils.Date.calculateHumanTimeDDHHMM(lockeeData.timeSinceLastLocked)}\``
    })
  }

  var dateJoinedDaysAgo = lockeeData.data.joined !== '-' ? `(${Math.round((Date.now() - new Date(lockeeData.data.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)` : ''
  var description = `Locked for \`${Math.round((lockeeData.data.cumulativeSecondsLocked / 2592000) * 100) / 100}\` months to date | \`${lockeeData.data.totalNoOfCompletedLocks}\` locks completed`
  // Only show the ratings if the user has > 5 & if the user has specified they want to show the rating
  if (lockeeData.data.noOfRatings > 4 && options.showRating) description += `\nAvg Rating \`${lockeeData.data.averageRating}\` | # Ratings \`${lockeeData.data.noOfRatings}\``
  description += `\nLongest (completed) \`${Utils.Date.calculateHumanTimeDDHHMM(
    lockeeData.data.longestCompletedLockInSeconds
  )}\` | Average Time Locked (overall) \`${Utils.Date.calculateHumanTimeDDHHMM(lockeeData.data.averageTimeLockedInSeconds)}\``
  description += `\nLast Active \`${Utils.Date.calculateHumanTimeDDHHMM(Date.now() / 1000 - lockeeData.data.timestampLastActive)}\``
  description += `\nJoined \`${lockeeData.data.joined.substr(0, 10)}\` ${dateJoinedDaysAgo}`
  // Only Show verified @User if the user is verified
  if (lockeeData.data.discordID) description += `\nVerified to ${Utils.User.buildUserChatAt(lockeeData.data.discordID, Utils.User.UserRefType.snowflake)}`

  const messageBlock = {
    embed: {
      title: `${lockeeData.data.discordID ? '<:verified:625628727820288000> ' : ''}\`${lockeeData.data.username}\` - ChastiKey Lockee Statistics - Active Stats`,
      description: description,
      color: 9125611,
      timestamp: Date.now(),
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Retrieved by Kiera`
      },
      // thumbnail: {
      //   url: 'https://cdn.discordapp.com/icons/473856867768991744/bab9c92c0183853f180fea791be0c5f4.jpg?size=256'
      // },
      fields: fields
    }
  }

  const messageBlockStrLength = JSON.stringify(messageBlock).length

  console.log('Lockee block length:', messageBlockStrLength)

  return messageBlock
}

/**
 * Generate an entry for each lock
 * @param {number} index
 * @param {LockeeDataLock} lock
 * @param {number} totalExpected
 * @returns
 */
function lockEntry(index: number, lock: LockeeDataLock, totalExpected: number) {
  const cumulative = lock.cumulative === 1 ? 'Cumulative' : 'Non-Cumulative'

  // Calculate human readible time for lock from seconds
  const combined = Utils.Date.calculateHumanTimeDDHHMM(lock.isLocked ? lock.totalTimeLocked : lock.timestampUnlocked - lock.timestampLocked)

  // Calculate regularity
  var regularity = ``
  if (lock.regularity < 1) {
    regularity = `${lock.regularity * 60}min`
  }
  if (lock.regularity === 1) {
    regularity = `${lock.regularity}hr`
  }
  if (lock.regularity > 1) {
    regularity = `${lock.regularity}hrs`
  }

  // Calculate count and Prep discard pile
  var discardPile = lock.discardPile.split(',').filter(c => c !== '')

  // If the cardpile is above 15 cards remove the last 5 (oldest 5)
  if (totalExpected <= 1 && discardPile.length > 5) {
    discardPile.splice(15, 22) /* console.log(totalExpected, 'NOT extra splicy') */
  }
  // Splice even more if this is beyond 3 locks to prevent hitting the Discord limit
  if (totalExpected > 1 && discardPile.length > 3) {
    discardPile.splice(3, 22) /* console.log(totalExpected, 'extra splicy') */
  }
  var discardPileStr = ``

  // Map each card from Array , to the correct discord Emoji & ID
  discardPile.forEach(card => {
    if (card !== '') discardPileStr += `${cardsEmoji[card]}`
  })

  // When the lock has a name
  if (lock.lockName !== '') {
    var name = `Active Lock ${index + 1} (\`${lock.lockName}\`)`
  } else {
    var name = `Active Lock ${index + 1}`
  }

  name += ` ${lock.cardInfoHidden || lock.timerHidden ? indicatorEmoji.Hidden : ''}`
  name += ` ${lock.lockFrozenByKeyholder || lock.lockFrozenByCard ? (lock.lockFrozenByKeyholder ? indicatorEmoji.Frozen : cardsEmoji.Freeze) : ''}`

  var value = ``
  value += `Keyholder **\`${lock.lockedBy}\`** Status **\`Locked\`** **\`${combined}\`**`

  // When its a variable lock
  if (lock.fixed === 0) {
    value += `\nDetails \`${cumulative}\` regularity \`${regularity}\` with \`${lock.noOfTurns}\` turns made.`
    if (totalExpected < 6) value += `\nThe last (${discardPile.length}) cards discarded:\n${discardPileStr}`
    else value += `\n${discardPileStr}`

    if (lock.cardInfoHidden === 0) {
      // Extra space
      value += `\n\nCards Remaining:`

      // Green cards
      value += `${cardsEmoji.Green} \`${lock.greenCards}\` `
      // Red cards
      value += `${cardsEmoji.Red} \`${lock.redCards}\` `
      // Yellow cards
      value += `${cardsEmoji.Yellow} \`${lock.yellowCards}\` `
      // Freeze Up cards
      value += `${cardsEmoji.Freeze} \`${lock.freezeCards}\` `
      // Double Up cards
      value += `${cardsEmoji.DoubleUp} \`${lock.doubleUpCards}\``
      // Reset Up cards
      value += `${cardsEmoji.Reset} \`${lock.resetCards}\``
    }
  } else {
    value += `\nDetails \`Fixed\`.`
  }

  return {
    name: name,
    value: value
  }
}

export function keyholderStats(
  data: TrackedChastiKeyKeyholderStatistics,
  activeLocks: Array<TrackedKeyholderLockeesStatistics>,
  cachedTimestamp: number,
  routerStats: RouterStats,
  verifiedTo: string,
  options: { showRating: boolean; showAverage: boolean; isVerified: boolean }
) {
  var dateJoinedDaysAgo = data.joined !== '-' ? `(${Math.round((Date.now() - new Date(data.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)` : ''
  var description = ``

  const dateRearrangedYYYY = data.dateFirstKeyheld.substr(6, 4)
  const dateRearrangedMM = data.dateFirstKeyheld.substr(3, 2)
  const dateRearrangedDD = data.dateFirstKeyheld.substr(0, 2)
  const dateFormatted = new Date(`${dateRearrangedYYYY}-${dateRearrangedMM}-${dateRearrangedDD}`)
  const dateFirstKHAgo = data.joined !== '-' ? `(${Math.round((Date.now() - dateFormatted.getTime()) / 1000 / 60 / 60 / 24)} days ago)` : ''

  var dateRearranged = `${dateRearrangedYYYY}-${dateRearrangedMM}-${dateRearrangedDD}`

  var lockCount = 0
  var lockLookedAt: Array<number> = []
  var cumulativeTimelocked = 0
  var numberOfFixed = 0
  var numberOfVar = 0
  var numberOfTurns = 0
  var individualLockStats: Array<{ name: string; count: number; fixed: boolean }> = []

  activeLocks.forEach(l => {
    // Add to avg and count for calculation
    var locksTotal = l.locks.reduce((currentVal, lock) => {
      if (lockLookedAt.findIndex(li => li === lock.secondsLocked) === -1) {
        lockLookedAt.push(lock.secondsLocked)
        // Count lock types & other cumulatives
        numberOfVar += !lock.fixed ? 1 : 0
        numberOfFixed += lock.fixed ? 1 : 0
        numberOfTurns += !lock.fixed ? lock.noOfTurns : 0

        // Track individual lock stats
        if (individualLockStats.findIndex(_l => _l.name === lock.sharedLockName) === -1) {
          individualLockStats.push({ name: lock.sharedLockName, count: 1, fixed: lock.fixed })
        } else {
          individualLockStats.find(_l => _l.name === lock.sharedLockName).count += 1
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
    var x = a.count
    var y = b.count
    if (x > y) {
      return -1
    }
    if (x < y) {
      return 1
    }
    return 0
  })

  if (data.noOfRatings > 4 && options.showRating) description += `Avg Rating **\`${data.averageRating}\`** | # Ratings **\`${data.noOfRatings}\`**\n`
  description += `# of Users Locked **\`${data.noOfLocksManagingNow}\`**\n`
  description += `# of Locks Flagged As Trusted **\`${data.noOfLocksFlaggedAsTrusted}\`** <:trustkeyholder:474975187310346240>\n`
  description += `# of Shared Locks **\`${data.noOfSharedLocks}\`**\nTotal Locks Managed **\`${data.totalLocksManaged}\`**\n`
  description += `Joined \`${data.joined.substr(0, 10)}\` ${dateJoinedDaysAgo}\n`
  description += `Date first keyheld \`${dateRearranged}\` ${dateFirstKHAgo}\n`
  if (data.isVerified) description += `Verified to ${verifiedTo}\n`

  description += `\n**Stats**\n`
  if (options.showAverage) description += `Average Time of Locks \`${lockCount > 1 ? Utils.Date.calculateHumanTimeDDHHMM(cumulativeTimelocked / lockCount) : '00d 00h 00m'}\`\n`
  description += `Cumulative Time Locked \`${Utils.Date.calculateHumanTimeDDHHMM(cumulativeTimelocked)}\`\n`
  description += `Number of Fixed Locks \`${numberOfFixed}\`\n`
  description += `Number of Variable Locks \`${numberOfVar}\`\n`
  description += `Number of Turns (variable) \`${numberOfTurns}\`\n\n`

  // For each lock
  description += `**Locks**\n`
  if (lockCount > 0) individualLockStats.forEach(lock => (description += `\`${lock.count}\` ${lock.name} \`[${lock.fixed ? 'F' : 'V'}]\`\n`))
  else {
    description += `No active locks to display!`
  }

  return {
    embed: {
      title: `${options.isVerified ? '<:verified:625628727820288000> ' : ''}\`${data.username}\` - ChastiKey Keyholder Statistics`,
      description: description,
      color: 9125611,
      timestamp: cachedTimestamp,
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
      }
      // thumbnail: {
      //   url: 'https://cdn.discordapp.com/icons/473856867768991744/bab9c92c0183853f180fea791be0c5f4.jpg?size=256'
      // }
    }
  }
}

export function sharedKeyholdersStats(data: Array<TrackedSharedKeyholderStatistics>, keyholderName: string, routerStats: RouterStats, cachedTimestamp: number) {
  const desc =
    data.length > 0
      ? `This query looks for lockees who share 1 or more keyholders with the given keyholder's name \`${keyholderName}\`. This will exclude anyone who has multiple fakes and this can be seen by the count showing differing numbers between Keyholder count and Active Locks.`
      : `This query looks for lockees who share 1 or more keyholders with the given keyholder's name \`${keyholderName}\`. This will exclude anyone who has multiple fakes and this can be seen by the count showing differing numbers between Keyholder count and Active Locks.\n\nAt present there are no lockees with other Keyholders under \`${keyholderName}\`.`

  // Sort lockees list
  data.sort((a, b) => {
    var x = String(a._id).toLowerCase()
    var y = String(b._id).toLowerCase()
    if (x < y) {
      return -1
    }
    if (x > y) {
      return 1
    }
    return 0
  })

  return {
    embed: {
      title: `Lockees with Multiple Keyholders`,
      description: desc,
      color: 9125611,
      timestamp: cachedTimestamp,
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
      },
      fields: data.map(lockee => {
        return {
          name: lockee._id,
          value: `Active Locks: \`${lockee.count}\`\nUnique Keyholders: \`${lockee.uniqueKHCount}\`\n\`\`\`${lockee.keyholders.sort().join(', ')}\`\`\``
        }
      })
    }
  }
}

export function keyholderLockees(data: Array<TrackedKeyholderLockeesStatistics>, keyholderName: string, routerStats: RouterStats, cachedTimestamp: number) {
  // Sort lockees list
  data.sort((a, b) => {
    var x = String(a._id).toLowerCase()
    var y = String(b._id).toLowerCase()
    if (x < y) {
      return -1
    }
    if (x > y) {
      return 1
    }
    return 0
  })

  const lockeeNames = data.map(l => l._id)

  return {
    embed: {
      title: `Keyholder Lockees`,
      description: `These are all lockees \`(${lockeeNames.length})\` under keyholder \`${keyholderName}\` who are currently locked\n\`\`\`${lockeeNames.join(`, `)}\`\`\``,
      color: 9125611,
      timestamp: cachedTimestamp,
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
      }
    }
  }
}
