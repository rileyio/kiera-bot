import * as Utils from '@/utils'

import { LockeeDataLock, LockeeDataResponse } from 'chastikey.js/app/objects'
import { cardsEmoji, indicatorEmoji } from '@/commands/chastikey/shared'

import { RoutedInteraction } from '@/router'

export function lockeeStats(lockeeData: LockeeDataResponse, options: { showRating: boolean }, routed: RoutedInteraction) {
  const fields: Array<{ name: string; value: string }> = []
  const locks = lockeeData.getLocked

  locks
    .filter((l, i) => i < 5) // Only process first 5 locks
    .forEach((l, i) => {
      if (i > 5) return // Stop here with new fields @ lock #5
      fields.push(lockEntry(i, l, fields.length, routed))
    })

  // If there are more than 5 locks
  if (locks.length > 5) {
    const additionalLocksField = {
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

  const description = routed.$render('ChastiKey.Stats.Lockee.MainStats', {
    avgRating: lockeeData.data.averageRating,
    avgTimeLocked: Utils.Date.calculateHumanTimeDDHHMM(lockeeData.data.averageTimeLockedInSeconds, true),
    buildNumberInstalled: lockeeData.data.buildNumberInstalled,
    isVerified: lockeeData.data.discordID ? true : false,
    joinedDate: lockeeData.data.joined.substr(0, 10),
    joinedDaysAgo: lockeeData.data.joined !== '-' ? `${Math.round((Date.now() - new Date(lockeeData.data.joined).getTime()) / 1000 / 60 / 60 / 24)}` : '',
    lastActiveInApp: Utils.Date.calculateHumanTimeDDHHMM(Date.now() / 1000 - lockeeData.data.timestampLastActive, true),
    lockedFor: Math.round((lockeeData.data.cumulativeSecondsLocked / 2592000) * 100) / 100,
    locksCompleted: lockeeData.data.totalNoOfCompletedLocks,
    ratings: lockeeData.data.noOfRatings,
    // Only show the ratings if the user has > 5 ratings
    showAvgRating: lockeeData.data.noOfRatings > 4,
    twitterUsername: lockeeData.data.twitterUsername,
    // Only Show verified @User if the user is verified
    verifiedTo: lockeeData.data.discordID ? Utils.User.buildUserChatAt(lockeeData.data.discordID, Utils.User.UserRefType.snowflake) : null,
    versionInstalled: lockeeData.data.versionInstalled
  })

  const messageBlock = {
    color: 9125611,
    description,
    fields: fields,
    footer: {
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routed.routerStats.performance}ms :: Requested By ${routed.routerStats.user} :: Retrieved by Kiera`
    },
    timestamp: Date.now(),
    title: routed.$render('ChastiKey.Stats.Lockee.Title', {
      isVerified: lockeeData.data.discordID ? true : false,
      username: lockeeData.data.username,
      verifiedEmoji: '<:verified:625628727820288000> '
    })
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
function lockEntry(index: number, lock: LockeeDataLock, totalExpected: number, routed: RoutedInteraction): { name: string; value: string } {
  // Calculate human readable time for lock from seconds
  const timeLocked = Utils.Date.calculateHumanTimeDDHHMM(lock.isLocked ? lock.totalTimeLocked : lock.timestampUnlocked - lock.timestampLocked, true)

  // Calculate regularity
  let regularity = ``
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
  const discardPile = lock.discardPile.split(',').filter((c) => c !== '')

  // If the cardpile is above 15 cards remove the last 5 (oldest 5)
  if (totalExpected <= 1 && discardPile.length > 5) {
    discardPile.splice(15, 22) /* console.log(totalExpected, 'NOT extra splicy') */
  }
  // Splice even more if this is beyond 3 locks to prevent hitting the Discord limit
  if (totalExpected > 1 && discardPile.length > 3) {
    discardPile.splice(3, 22) /* console.log(totalExpected, 'extra splicy') */
  }
  let discardPileStr = ``

  // Map each card from Array , to the correct discord Emoji & ID
  discardPile.forEach((card) => {
    if (card !== '') discardPileStr += `${cardsEmoji[card]}`
  })

  // Build Title/Name section for lock
  let name = `:lock:`
  name += ` ${lock.cardInfoHidden || lock.timerHidden ? indicatorEmoji.Hidden : ''}`
  name += ` ${lock.lockFrozenByKeyholder || lock.lockFrozenByCard ? (lock.lockFrozenByKeyholder ? indicatorEmoji.Frozen : cardsEmoji.Freeze) : ''}`
  name += ` ${lock.isTrustedKeyholder ? indicatorEmoji.TrustedKH : ''}`

  // When the lock has a name
  lock.lockName !== '' ? (name += ` \`${lock.lockName}\``) : (name += ` \`<Lock not named>\``)

  // Build Remaining cards string
  let remaining = ``
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

  const valueReplacement = routed.$render('ChastiKey.Stats.Lockee.LockStats', {
    cardsRemaining: remaining,
    discardPile: discardPileStr,
    discardPileLength: discardPile.length,
    hasPickedCard: lock.timestampLastPicked > 0,
    isCumulative: lock.cumulative === 1,
    isFixed: lock.isFixed,
    isFrozen: lock.totalTimeFrozen > 0,
    isHidden: lock.cardInfoHidden === 1,
    isLockNamed: lock.lockName !== '',
    isSelfLocked: lock.lockedBy === '',
    keyholderName: lock.lockedBy,
    lastPickedTime: Utils.Date.calculateHumanTimeDDHHMM(Date.now() / 1000 - lock.timestampLastPicked, true),
    lockedTime: timeLocked,
    nextPickNow: lock.timestampNextPick - Date.now() / 1000 <= 0,
    nextPickTime: Utils.Date.calculateHumanTimeDDHHMM(lock.timestampNextPick - Date.now() / 1000, true),
    regularity: regularity,
    showNextPick: lock.timestampNextPick > 0 && !lock.isFixed,
    totalTimeFrozen: Utils.Date.calculateHumanTimeDDHHMM(lock.totalTimeFrozen, true),
    turnsMade: lock.noOfTurns
  })

  return {
    name: name,
    value: valueReplacement
  }
}