import { TrackedChastiKeyLock, TrackedKeyholderStatistics } from '../objects/chastikey';
import { performance } from 'perf_hooks';

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

const indicatorEmoji = {
  Frozen: `<:frozenlock:539233483537645568>`,
  Hidden: `<:hiddencircle:474973202607767562>`
}

const cardsEmoji = {
  YellowMinus2: `<:yellowremove2:539085546136535110>`,
  YellowMinus1: `<:yellowremove1:539085541724127242>`,
  YellowAdd3: `<:yellowadd3:539085545368846353>`,
  YellowAdd2: `<:yellowadd2:539085543699513368>`,
  YellowAdd1: `<:yellowadd1:539085541526994964>`,
  Reset: `<:resetcard:498994540418695168>`,
  Red: `<:redcard:498994540338872351>`,
  GoAgain: '<:goagain:539107316423720975>',
  // greencard: `<:greencard:498994537507717140>`,
  DoubleUp: `<:doubleup:498994541362282506>`,
  Freeze: `<:freezecard:498994540326158336>`
}

export function lockeeStats(data: LockeeStats) {
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
  if (data.noOfRatings > 4) description += ` | Avg Rating \`${data.averageRating}\` | # Ratings \`${data.noOfRatings}\``
  description += `\nLongest \`${calculateHumanTime(data.longestLock)}\` | Average Time Locked \`${calculateHumanTime(data.averageLocked)}\``
  description += `\nJoined \`${data.joined.substr(0,10)}\` ${dateJoinedDaysAgo}`

  return {
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
}

function calculateHumanTime(seconds: number) {
  // Calculate human readible time for lock from seconds
  const timelocked = seconds
  var min = Math.floor(timelocked / 60)
  var hrs = Math.floor(min / 60)
  min = min % 60
  var days = Math.floor(hrs / 24)
  hrs = hrs % 24

  const timeToShowDays = `${days > 9 ? + days : '0' + days}d`
  const timeToShowHours = `${hrs > 9 ? + hrs : '0' + hrs}h`
  const timeToShowMins = `${min > 9 ? + min : '0' + min}m`

  return `${timeToShowDays} ${timeToShowHours} ${timeToShowMins}`
}

function lockEntry(index: number, lock: TrackedChastiKeyLock, totalExpected: number) {
  const cumulative = lock.cumulative === 1 ? 'Cumulative' : 'Non-Cumulative'

  // Calculate human readible time for lock from seconds
  const combined = calculateHumanTime(lock.secondsLocked)

  // Calculate regularity
  var regularity = ``
  if (lock.regularity < 1) { regularity = `${(lock.regularity * 60)}min` }
  if (lock.regularity === 1) { regularity = `${lock.regularity}hr` }
  if (lock.regularity > 1) { regularity = `${lock.regularity}hrs` }

  // Calculate count and Prep discard pile
  var discardPile = lock.discard_pile.split(',').filter(c => c !== '')
  // If the cardpile is above 15 cards remove the last 5 (oldest 5)
  if (discardPile.length > 15) discardPile.splice(15, 22)
  // Splice even more if this is beyond 3 locks to prevent hitting the Discord limit
  if (totalExpected > 5 && discardPile.length > 5) discardPile.splice(15, 22)
  var discardPileStr = ``

  // Map each card from Array , to the correct discord Emoji & ID
  discardPile.forEach(card => { if (card !== '') discardPileStr += `${cardsEmoji[card]}` })

  var name = `Active Lock ${(index + 1)}`
  name += ` ${(lock.card_info_hidden || lock.timer_hidden) ? indicatorEmoji.Hidden : ''}`
  name += ` ${(lock.lock_frozen_by_keyholder || lock.lock_frozen_by_card)
    ? (lock.lock_frozen_by_keyholder) ? indicatorEmoji.Frozen : cardsEmoji.Freeze : ''}`

  var value = ``
  value += `Keyholder **\`${lock.keyholder}\`** Status **\`Locked\`** **\`${combined}\`**`

  // When its a variable lock
  if (lock.fixed === 0) {
    value += `\nDetails \`${cumulative}\` regularity \`${regularity}\` with \`${lock.noOfTurns}\` turns made.`
    if (totalExpected < 6) value += `\nThe last (${discardPile.length}) cards discarded (not greens):\n${discardPileStr}`
    else value += `\n${discardPileStr}`
  }
  else {
    value += `\nDetails \`Fixed\`.`
  }

  return {
    name: name,
    value: value
  }
}

export function keyholderStats(data: TrackedKeyholderStatistics) {
  var dateJoinedDaysAgo = (data.joined !== '-')
  ? `(${Math.round((Date.now() - new Date(data.joined).getTime()) / 1000 / 60 / 60 / 24)} days ago)`
  : ''
  var description = ``
  if (data.noOfRatings > 4) description += `Avg Rating **\`${data.averageRating}\`** | # Ratings **\`${data.noOfRatings}\`**\n`
  description += `# of Users Locked **\`${data.noOfLocksManagingNow}\`**\n`
  description += `# of Locks Flagged As Trusted **\`${data.noOfLocksFlaggedAsTrusted}\`** <:trustkeyholder:474975187310346240>\n`
  description += `# of Shared Locks **\`${data.noOfSharedLocks}\`**\nTotal Locks Managed **\`${data.totalLocksManaged}\`**\n`
  description += `Joined \`${data.joined.substr(0,10)}\` ${dateJoinedDaysAgo}`

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