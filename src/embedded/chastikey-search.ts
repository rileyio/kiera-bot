import { TrackedChastiKeyUser } from '../objects/chastikey'

export function searchResults(found: Array<TrackedChastiKeyUser>) {
  var description = ``

  found.forEach(ckUser => {
    console.log(ckUser.username, ckUser.displayInStats)
    description += `${!ckUser.displayInStats ? '<:statshidden:631822699425169429>' : ''}${ckUser.isVerified() ? '<:verified:631826983688339474> ' : ''}${ckUser.username}\n`
  })

  return {
    embed: {
      title: `Search Results`,
      description: description,
      color: 14553782
    }
  }
}