import { TrackedChastiKeyLock, TrackedKeyholderStatistics } from '../objects/chastikey';
import { performance } from 'perf_hooks';
import * as Utils from '../utils/';

export interface LockeeStats {
  averageLocked: number
  averageRating: number | string
  cacheTimestamp: number | string
  locks: Array<TrackedChastiKeyLock>
  longestLock: number
  monthsLocked: number | string
  noOfRatings: number | string
  totalNoOfCompletedLocks: number
  username: string
  joined: string
  // Performance tracking
  _performance: { start: number, end: number }
}

export interface TrackedSharedKeyholderStatistics {
  _id: string
  keyholders: Array<string>
  count: number
  uniqueKHCount: number
}

export interface TrackedKeyholderLockeesStatistics {
  _id: string
  locks: {
    fixed: boolean,
    timer_hidden: boolean,
    lock_frozen_by_keyholder: boolean,
    lock_frozen_by_card: boolean,
    keyholder: string
  }
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

export function lockeeStats(data: LockeeStats, options: { showRating: boolean }) {
  var fields: Array<{ name: string; value: string; }> = []

  data.locks.forEach((l, i) => {
    if (i > 19) return // Skip, there can only be 20 locks in the db, this means theres an issue server side
    fields.push(lockEntry(i, l, fields.length))
  })

  // When no locks are active, add a different field to indicate this
  if (fields.length === 0) {
    fields.push({
      name: 'No active locks',
      value: 'To see any additional stats a lock must be active.'
    })
  }

  var dateJoinedDaysAgo = (data.joined !== '-')
    ? `(${Math.round((Date.now() - new Date(data.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)`
    : ''
  var description = `Locked for \`${data.monthsLocked}\` months to date | \`${data.totalNoOfCompletedLocks}\` locks completed`
  // Only show the ratings if the user has > 5
  if (data.noOfRatings > 4 && options.showRating) description += ` | Avg Rating \`${data.averageRating}\` | # Ratings \`${data.noOfRatings}\``
  description += `\nLongest \`${Utils.Date.calculateHumanTimeDDHHMM(data.longestLock)}\` | Average Time Locked \`${Utils.Date.calculateHumanTimeDDHHMM(data.averageLocked)}\``
  description += `\nJoined \`${data.joined.substr(0, 10)}\` ${dateJoinedDaysAgo}`

  const messageBlock = {
    embed: {
      title: `\`${data.username}\` - ChastiKey Lockee Statistics`,
      description: description,
      color: 9125611,
      timestamp: (data.cacheTimestamp) ? new Date((<number>data.cacheTimestamp) * 1000).toISOString() : '',
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `(${Math.round(performance.now() - data._performance.start)}ms) Cached by Kiera`
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
 * @param {TrackedChastiKeyLock} lock
 * @param {number} totalExpected
 * @returns
 */
function lockEntry(index: number, lock: TrackedChastiKeyLock, totalExpected: number) {
  const cumulative = lock.cumulative === 1 ? 'Cumulative' : 'Non-Cumulative'

  // Calculate human readible time for lock from seconds
  const combined = Utils.Date.calculateHumanTimeDDHHMM(lock.secondsLocked)

  // Calculate regularity
  var regularity = ``
  if (lock.regularity < 1) { regularity = `${(lock.regularity * 60)}min` }
  if (lock.regularity === 1) { regularity = `${lock.regularity}hr` }
  if (lock.regularity > 1) { regularity = `${lock.regularity}hrs` }

  // Calculate count and Prep discard pile
  var discardPile = lock.discard_pile.split(',').filter(c => c !== '')

  // If the cardpile is above 15 cards remove the last 5 (oldest 5)
  // if (totalExpected <= 5 && discardPile.length > 5) { discardPile.splice(15, 22); /* console.log(totalExpected, 'NOT extra splicy') */ }
  // // Splice even more if this is beyond 3 locks to prevent hitting the Discord limit
  // if (totalExpected > 5 && discardPile.length > 3) { discardPile.splice(3, 22); /* console.log(totalExpected, 'extra splicy') */ }

  // If the cardpile is above 15 cards remove the last 5 (oldest 5)
  if (totalExpected <= 1 && discardPile.length > 5) { discardPile.splice(15, 22); /* console.log(totalExpected, 'NOT extra splicy') */ }
  // Splice even more if this is beyond 3 locks to prevent hitting the Discord limit
  if (totalExpected > 1 && discardPile.length > 3) { discardPile.splice(3, 22); /* console.log(totalExpected, 'extra splicy') */ }
  var discardPileStr = ``

  // Map each card from Array , to the correct discord Emoji & ID»
  discardPile.forEach(card => { if (card !== '') discardPileStr += `${cardsEmoji[card]}` })

  // When the lock has a name
  if (lock.sharedLockName !== '') {
    var name = `Active Lock ${(index + 1)} (\`${lock.sharedLockName}\`)`
  }
  else {
    var name = `Active Lock ${(index + 1)}`
  }

  name += ` ${(lock.card_info_hidden || lock.timer_hidden) ? indicatorEmoji.Hidden : ''}`
  name += ` ${(lock.lock_frozen_by_keyholder || lock.lock_frozen_by_card)
    ? (lock.lock_frozen_by_keyholder) ? indicatorEmoji.Frozen : cardsEmoji.Freeze : ''}`

  var value = ``
  value += `Keyholder **\`${lock.lockedBy}\`** Status **\`Locked\`** **\`${combined}\`**`

  // When its a variable lock
  if (lock.fixed === 0) {
    value += `\nDetails \`${cumulative}\` regularity \`${regularity}\` with \`${lock.noOfTurns}\` turns made.`
    if (totalExpected < 6) value += `\nThe last (${discardPile.length}) cards discarded (not greens):\n${discardPileStr}`
    else value += `\n${discardPileStr}`

    if (lock.card_info_hidden === 0) {
      // Extra space
      value += `\n\nCards Remaining:`

      // Green cards
      value += `${cardsEmoji.Green} \`${lock.green_cards}\` `
      // Yellow cards
      value += `${cardsEmoji.Yellow} \`${lock.yellow_cards}*\` `
      // Red cards
      value += `${cardsEmoji.Red} \`${lock.red_cards}\` `
      // Double Up cards
      value += `${cardsEmoji.DoubleUp} \`${lock.double_up_cards}\` `
      // Reset Up cards
      value += `${cardsEmoji.Freeze} \`${lock.freeze_cards}\``
      // Reset Up cards
      value += `${cardsEmoji.Reset} \`${lock.reset_cards}\``
    }
  }
  else {
    value += `\nDetails \`Fixed\`.`
  }

  return {
    name: name,
    value: value
  }
}

export function keyholderStats(data: TrackedKeyholderStatistics, options: { showRating: boolean }) {
  var dateJoinedDaysAgo = (data.joined !== '-')
    ? `(${Math.round((Date.now() - new Date(data.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)`
    : ''
  var description = ``

  const dateRearrangedYYYY = data.dateFirstKeyheld.substr(6, 4)
  const dateRearrangedMM = data.dateFirstKeyheld.substr(3, 2)
  const dateRearrangedDD = data.dateFirstKeyheld.substr(0, 2)
  const dateFormatted = new Date(`${dateRearrangedYYYY}-${dateRearrangedMM}-${dateRearrangedDD}`)
  const dateFirstKHAgo = (data.joined !== '-')
    ? `(${Math.round((Date.now() - dateFormatted.getTime()) / 1000 / 60 / 60 / 24)} days ago)`
    : ''

  var dateRearranged = `${dateRearrangedYYYY}-${dateRearrangedMM}-${dateRearrangedDD}`

  if (data.noOfRatings > 4 && options.showRating) description += `Avg Rating **\`${data.averageRating}\`** | # Ratings **\`${data.noOfRatings}\`**\n`
  description += `# of Users Locked **\`${data.noOfLocksManagingNow}\`**\n`
  description += `# of Locks Flagged As Trusted **\`${data.noOfLocksFlaggedAsTrusted}\`** <:trustkeyholder:474975187310346240>\n`
  description += `# of Shared Locks **\`${data.noOfSharedLocks}\`**\nTotal Locks Managed **\`${data.totalLocksManaged}\`**\n`
  description += `Joined \`${data.joined.substr(0, 10)}\` ${dateJoinedDaysAgo}\n`
  description += `Date first keyheld \`${dateRearranged}\` ${dateFirstKHAgo}`

  return {
    embed: {
      title: `\`${data.username}\` - ChastiKey Keyholder Statistics`,
      description: description,
      color: 9125611,
      // timestamp: '',
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: 'Cached by Kiera'
      },
      // thumbnail: {
      //   url: 'https://cdn.discordapp.com/icons/473856867768991744/bab9c92c0183853f180fea791be0c5f4.jpg?size=256'
      // }
    }
  }
}

export function sharedKeyholdersStats(data: Array<TrackedSharedKeyholderStatistics>, keyholderName: string) {
  const desc = data.length > 0
    ? `This query looks for lockees who share 1 or more keyholders with the given keyholder's name \`${keyholderName}\`. This will exclude anyone who has multiple fakes and this can be seen by the count showing differing numbers between Keyholder count and Active Locks.`
    : `This query looks for lockees who share 1 or more keyholders with the given keyholder's name \`${keyholderName}\`. This will exclude anyone who has multiple fakes and this can be seen by the count showing differing numbers between Keyholder count and Active Locks.\n\nAt present there are no lockees with other Keyholders under \`${keyholderName}\`.`

  // Sort lockees list
  data.sort((a, b) => {
    var x = String(a._id).toLowerCase();
    var y = String(b._id).toLowerCase();
    if (x < y) { return -1; }
    if (x > y) { return 1; }
    return 0;
  })

  return {
    embed: {
      title: `Lockees with Multiple Keyholders`,
      description: desc,
      color: 9125611,
      // timestamp: (data.cacheTimestamp) ? new Date((<number>data.cacheTimestamp) * 1000).toISOString() : '',
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: 'Cached by Kiera'
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

export function keyholderLockees(data: Array<TrackedKeyholderLockeesStatistics>, keyholderName: string) {
  // Sort lockees list
  data.sort((a, b) => {
    var x = String(a._id).toLowerCase();
    var y = String(b._id).toLowerCase();
    if (x < y) { return -1; }
    if (x > y) { return 1; }
    return 0;
  })

  const lockeeNames = data.map(l => l._id)

  return {
    embed: {
      title: `Keyholder Lockees`,
      description: `These are all lockees \`(${lockeeNames.length})\` under keyholder \`${keyholderName}\` who are currently locked\n\`\`\`${lockeeNames.join(`, `)}\`\`\``,
      color: 9125611,
      // timestamp: (data.cacheTimestamp) ? new Date((<number>data.cacheTimestamp) * 1000).toISOString() : '',
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: 'Cached by Kiera'
      }
    }
  }
}