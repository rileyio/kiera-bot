import * as Utils from '@/utils'
import { RouterStats, RouterRouted } from '@/router'
import { LockeeDataLock, LockeeDataResponse, UserData, KeyholderData } from 'chastikey.js/app/objects'

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
    cumulative: boolean
  }>
}

const indicatorEmoji = {
  Frozen: `<:frozenlock:539233483537645568>`,
  Hidden: `<:hiddencircle:474973202607767562>`,
  TrustedKH: `<:trustkeyholder:474975187310346240>`
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
  Freeze: `<:1_:601169050294419476>`,
  Sticky: `<:stickycard:726348014977024011>`
}

export function lockeeStats(lockeeData: LockeeDataResponse, options: { showRating: boolean }, routed: RouterRouted) {
  var fields: Array<{ name: string; value: string }> = []
  var locks = lockeeData.getLocked

  locks
    .filter((l, i) => i < 5) // Only process first 5 locks
    .forEach((l, i) => {
      if (i > 5) return // Stop here with new fields @ lock #5
      fields.push(lockEntry(i, l, fields.length, routed))
    })

  // If there are more than 5 locks
  if (locks.length > 5) {
    var additionalLocksField = {
      name: routed.$render('ChastiKey.Stats.Lockee.AdditionalLocksField', { count: locks.length - 5 }),
      value: `...`
    }

    locks
      .filter((l, i) => i >= 5) // Process beyond lock #5 with a list of lock IDs
      .forEach((l) => {
        additionalLocksField.value += `${l.lockID}\n`
      })

    // Add to existing locks fields array
    fields.push(additionalLocksField)
  }

  if (fields.length === 0) {
    // When no locks are active, add a different field to indicate this
    fields.push({
      name: routed.$render('ChastiKey.Stats.Lockee.NoActiveLocks'),
      value: routed.$render('ChastiKey.Stats.Lockee.NoActiveLocksTimeSinceLast', { time: Utils.Date.calculateHumanTimeDDHHMM(lockeeData.timeSinceLastLocked, true) })
    })
  }

  var description = routed.$render('ChastiKey.Stats.Lockee.MainStats', {
    lockedFor: Math.round((lockeeData.data.cumulativeSecondsLocked / 2592000) * 100) / 100,
    locksCompleted: lockeeData.data.totalNoOfCompletedLocks,
    // Only show the ratings if the user has > 5 & if the user has specified they want to show the rating
    showAvgRating: lockeeData.data.noOfRatings > 4 && options.showRating,
    avgRating: lockeeData.data.averageRating,
    ratings: lockeeData.data.noOfRatings,
    longestLockCompleted: Utils.Date.calculateHumanTimeDDHHMM(lockeeData.data.longestCompletedLockInSeconds, true),
    avgTimeLocked: Utils.Date.calculateHumanTimeDDHHMM(lockeeData.data.averageTimeLockedInSeconds, true),
    lastActiveInApp: Utils.Date.calculateHumanTimeDDHHMM(Date.now() / 1000 - lockeeData.data.timestampLastActive, true),
    joinedDate: lockeeData.data.joined.substr(0, 10),
    joinedDaysAgo: lockeeData.data.joined !== '-' ? `${Math.round((Date.now() - new Date(lockeeData.data.joined).getTime()) / 1000 / 60 / 60 / 24)}` : '',
    // Only Show verified @User if the user is verified
    isVerified: lockeeData.data.discordID ? true : false,
    verifiedTo: lockeeData.data.discordID ? Utils.User.buildUserChatAt(lockeeData.data.discordID, Utils.User.UserRefType.snowflake) : null,
    buildNumberInstalled: lockeeData.data.buildNumberInstalled,
    versionInstalled: lockeeData.data.versionInstalled,
    twitterUsername: lockeeData.data.twitterUsername
  })

  const messageBlock = {
    title: routed.$render('ChastiKey.Stats.Lockee.Title', {
      isVerified: lockeeData.data.discordID ? true : false,
      verifiedEmoji: '<:verified:625628727820288000> ',
      username: lockeeData.data.username
    }),
    description: description,
    color: 9125611,
    timestamp: Date.now(),
    footer: {
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routed.routerStats.performance}ms :: Requested By ${routed.routerStats.user} :: Retrieved by Kiera`
    },
    // thumbnail: {
    //   url: 'https://cdn.discordapp.com/icons/473856867768991744/bab9c92c0183853f180fea791be0c5f4.jpg?size=256'
    // },
    fields: fields
  }

  // Left in for debugging locally
  console.log('Lockee block length:', JSON.stringify(messageBlock).length)
  return messageBlock
}

/**
 * Generate an entry for each lock
 * @param {number} index
 * @param {LockeeDataLock} lock
 * @param {number} totalExpected
 * @returns
 */
function lockEntry(index: number, lock: LockeeDataLock, totalExpected: number, routed: RouterRouted): { name: string; value: string } {
  // Calculate human readable time for lock from seconds
  const timeLocked = Utils.Date.calculateHumanTimeDDHHMM(lock.isLocked ? lock.totalTimeLocked : lock.timestampUnlocked - lock.timestampLocked, true)

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
  var discardPile = lock.discardPile.split(',').filter((c) => c !== '')

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
  discardPile.forEach((card) => {
    if (card !== '') discardPileStr += `${cardsEmoji[card]}`
  })

  // Build Title/Name section for lock
  var name = `:lock:`
  name += ` ${lock.cardInfoHidden || lock.timerHidden ? indicatorEmoji.Hidden : ''}`
  name += ` ${lock.lockFrozenByKeyholder || lock.lockFrozenByCard ? (lock.lockFrozenByKeyholder ? indicatorEmoji.Frozen : cardsEmoji.Freeze) : ''}`
  name += ` ${lock.isTrustedKeyholder ? indicatorEmoji.TrustedKH : ''}`

  // When the lock has a name
  lock.lockName !== '' ? (name += ` \`${lock.lockName}\``) : (name += ` \`<Lock not named>\``)

  // Build Remaining cards string
  var remaining = ``
  // When its a variable lock
  if (lock.fixed === 0 && lock.cardInfoHidden === 0) {
    // Extra space
    // Green cards
    remaining += `${cardsEmoji.Green} \`${lock.greenCards}\` `
    // Red cards
    remaining += `${cardsEmoji.Red} \`${lock.redCards}\` `
    // Sticky cards
    remaining += `${cardsEmoji.Sticky} \`${lock.stickyCards}\``
    // Yellow cards
    remaining += `${cardsEmoji.Yellow} \`${lock.yellowCards}\` `
    // Freeze Up cards
    remaining += `${cardsEmoji.Freeze} \`${lock.freezeCards}\` `
    // Double Up cards
    remaining += `${cardsEmoji.DoubleUp} \`${lock.doubleUpCards}\``
    // Reset Up cards
    remaining += `${cardsEmoji.Reset} \`${lock.resetCards}\``
  }

  var valueReplacement = routed.$render('ChastiKey.Stats.Lockee.LockStats', {
    isFixed: lock.isFixed,
    isFrozen: lock.totalTimeFrozen > 0,
    isSelfLocked: lock.lockedBy === '',
    isCumulative: lock.cumulative === 1,
    isHidden: lock.cardInfoHidden === 1,
    isLockNamed: lock.lockName !== '',
    keyholderName: lock.lockedBy,
    lockedTime: timeLocked,
    totalTimeFrozen: Utils.Date.calculateHumanTimeDDHHMM(lock.totalTimeFrozen, true),
    lastPickedTime: Utils.Date.calculateHumanTimeDDHHMM(Date.now() / 1000 - lock.timestampLastPicked, true),
    hasPickedCard: lock.timestampLastPicked > 0,
    showNextPick: lock.timestampNextPick > 0 && !lock.isFixed,
    nextPickNow: lock.timestampNextPick - Date.now() / 1000 <= 0,
    nextPickTime: Utils.Date.calculateHumanTimeDDHHMM(lock.timestampNextPick - Date.now() / 1000, true),
    regularity: regularity,
    turnsMade: lock.noOfTurns,
    discardPileLength: discardPile.length,
    discardPile: discardPileStr,
    cardsRemaining: remaining
  })
  var value = ``

  return {
    name: name,
    value: valueReplacement
  }
}

export function keyholderStats(
  keyholderData: KeyholderData,
  activeLocks: Array<TrackedKeyholderLockeesStatistics>,
  cachedTimestamp: number,
  routerStats: RouterStats,
  options: { showRating: boolean; showAverage: boolean }
) {
  var dateJoinedDaysAgo = keyholderData.joined !== '-' ? `(${Math.round((Date.now() - new Date(keyholderData.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)` : ''
  var description = ``

  const dateRearrangedYYYY = keyholderData.dateFirstKeyheld.substr(6, 4)
  const dateRearrangedMM = keyholderData.dateFirstKeyheld.substr(3, 2)
  const dateRearrangedDD = keyholderData.dateFirstKeyheld.substr(0, 2)
  const dateFormatted = new Date(`${dateRearrangedYYYY}-${dateRearrangedMM}-${dateRearrangedDD}`)
  const dateFirstKHAgo = keyholderData.joined !== '-' ? `(${Math.round((Date.now() - dateFormatted.getTime()) / 1000 / 60 / 60 / 24)} days ago)` : ''

  var dateRearranged = `${dateRearrangedYYYY}-${dateRearrangedMM}-${dateRearrangedDD}`

  var lockCount = 0
  var lockLookedAt: Array<number> = []
  var cumulativeTimelocked = 0
  var numberOfFixed = 0
  var numberOfVar = 0
  var numberOfTurns = 0
  var individualLockStats: Array<{ name: string; count: number; fixed: boolean; cumulative: boolean }> = []

  activeLocks.forEach((l) => {
    // Add to avg and count for calculation
    var locksTotal = l.locks.reduce((currentVal, lock) => {
      if (lockLookedAt.findIndex((li) => li === lock.secondsLocked) === -1) {
        lockLookedAt.push(lock.secondsLocked)
        // Count lock types & other cumulatives
        numberOfVar += !lock.fixed ? 1 : 0
        numberOfFixed += lock.fixed ? 1 : 0
        numberOfTurns += !lock.fixed ? lock.noOfTurns : 0

        // Track individual lock stats
        if (individualLockStats.findIndex((_l) => _l.name === lock.sharedLockName) === -1) {
          individualLockStats.push({ name: lock.sharedLockName, count: 1, fixed: lock.fixed, cumulative: lock.cumulative })
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
    title: `${keyholderData.isVerified ? '<:verified:625628727820288000> ' : ''}\`${keyholderData.username}\` - ChastiKey Keyholder Statistics`,
    description: description,
    color: 9125611,
    timestamp: cachedTimestamp,
    footer: {
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
    }
    // thumbnail: {
    //   url: 'https://cdn.discordapp.com/icons/473856867768991744/bab9c92c0183853f180fea791be0c5f4.jpg?size=256'
    // }
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
    title: `Lockees with Multiple Keyholders`,
    description: desc,
    color: 9125611,
    timestamp: cachedTimestamp,
    footer: {
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
    },
    fields: data.map((lockee) => {
      return {
        name: lockee._id,
        value: `Active Locks: \`${lockee.count}\`\nUnique Keyholders: \`${lockee.uniqueKHCount}\`\n\`\`\`${lockee.keyholders.sort().join(', ')}\`\`\``
      }
    })
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

  const lockeeNames = data.map((l) => l._id)

  return {
    title: `Keyholder Lockees`,
    description:
      lockeeNames.length > 0
        ? `These are all lockees \`(${lockeeNames.length})\` under keyholder \`${keyholderName}\` who are currently locked\n\`\`\`${lockeeNames.join(`, `)}\`\`\``
        : `\`${keyholderName}\` has no lockees presently.`,
    color: 9125611,
    timestamp: cachedTimestamp,
    footer: {
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
    }
  }
}
