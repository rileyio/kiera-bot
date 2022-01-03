import { RouterStats } from '@/router'
import { TrackedKeyholderLockeesStatistics } from '@/commands/chastikey/shared'

export function keyholderLockees(data: Array<TrackedKeyholderLockeesStatistics>, keyholderName: string, routerStats: RouterStats, cachedTimestamp: number) {
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

  const lockeeNames = data.map((l) => l._id)

  return {
    color: 9125611,
    description:
      lockeeNames.length > 0
        ? `These are all lockees \`(${lockeeNames.length})\` under keyholder \`${keyholderName}\` who are currently locked\n\`\`\`${lockeeNames.join(`, `)}\`\`\``
        : `\`${keyholderName}\` has no lockees presently.`,
    footer: {
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
    },
    timestamp: cachedTimestamp,
    title: `Keyholder Lockees`
  }
}
