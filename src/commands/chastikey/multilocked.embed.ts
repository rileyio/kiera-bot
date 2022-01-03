import { RouterStats } from '@/router'
import { TrackedSharedKeyholderStatistics } from '@/commands/chastikey/shared'

export function embed(data: Array<TrackedSharedKeyholderStatistics>, keyholderName: string, routerStats: RouterStats, cachedTimestamp: number) {
  const desc =
    data.length > 0
      ? `This query looks for lockees who share 1 or more keyholders with the given keyholder's name \`${keyholderName}\`. This will exclude anyone who has multiple fakes and this can be seen by the count showing differing numbers between Keyholder count and Active Locks.`
      : `This query looks for lockees who share 1 or more keyholders with the given keyholder's name \`${keyholderName}\`. This will exclude anyone who has multiple fakes and this can be seen by the count showing differing numbers between Keyholder count and Active Locks.\n\nAt present there are no lockees with other Keyholders under \`${keyholderName}\`.`

  // Sort lockees list
  data.sort((a, b) => {
    const x = String(a._id).toLowerCase()
    const y = String(b._id).toLowerCase()
    if (x < y) {
      return -1
    }
    if (x > y) {
      return 1
    }
    return 0
  })

  return {
    color: 9125611,
    description: desc,
    fields: data.map((lockee) => {
      return {
        name: lockee._id,
        value: `Active Locks: \`${lockee.count}\`\nUnique Keyholders: \`${lockee.uniqueKHCount}\`\n\`\`\`${lockee.keyholders.sort().join(', ')}\`\`\``
      }
    }),
    footer: {
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
    },
    timestamp: cachedTimestamp,
    title: `Lockees with Multiple Keyholders`
  }
}
