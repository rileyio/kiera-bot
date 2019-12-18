import { TrackedChastiKeyUser } from '@/objects/chastikey'
import { RouterStats } from '@/router'

export function searchResults(found: Array<TrackedChastiKeyUser>, routerStats: RouterStats, cachedTimestamp: number) {
  var description = ``

  found.forEach(ckUser => {
    console.log(ckUser.username, ckUser.displayInStats)
    description += `${!ckUser.displayInStats ? '<:statshidden:631822699425169429>' : ''}${ckUser.isVerified() ? '<:verified:631826983688339474> ' : ''}${ckUser.username}\n`
  })

  return {
    embed: {
      title: `Search Results`,
      description: description,
      color: 14553782,
      timestamp: cachedTimestamp,
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
      }
    }
  }
}
