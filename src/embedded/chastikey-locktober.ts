import { RouterStats } from '@/router'

export function locktoberStats(
  participation: { participants: number; verified: number },
  khBreakdown: Array<{ _id: string; count: number; uniqueCount: number }>,
  isUserApart: boolean,
  isUserVerified: boolean,
  routerStats: RouterStats,
  cachedTimestamp: Date
) {
  // Variables for later
  var longestKHName = 9
  var largestCount = 5
  // Find the longest KH name for formatting later
  khBreakdown.forEach((kh) => {
    longestKHName = kh._id.length > longestKHName ? kh._id.length : longestKHName
    largestCount = String(kh.count).length > largestCount ? String(kh.count).length : largestCount
  })

  // Title
  var description = `What is Locktober? Be locked for the entire month of October :yum:\n\n`
  // Display steps to verify if user is missing verification
  if (!isUserVerified) description += `You'll need to verify using the following command to receive the role when eligible: \`!ck verify\`\n\n`
  // Statistics
  description += `# of participants (who have verified): **\`${participation.participants}\`**\n`
  description += `% of participation among verified users: **\`${Math.round((participation.participants / participation.verified) * 100)}%\` \`(${participation.participants}/${
    participation.verified
  })\`**\n`
  // If user's eligible for the Locktober role
  description += isUserApart ? `\n🎃 **Your lock is a valid Locktober lock!** 🎃\n` : ``
  // Display KH breakdown
  description += `\n**Top 5 KH by eligible Locktober lockees:**`
  description += `\`\`\``
  description += `Keyholder${Array.from(Array(longestKHName + 3 - 9)).join(' ')}Locks${Array.from(Array(largestCount + 3 - 5)).join(' ')}w/o Fakes\n`
  khBreakdown.slice(0, 5).forEach((kh, i) => {
    description += `${kh._id}${Array.from(Array(longestKHName + 3 - kh._id.length)).join(' ')}${kh.count}${Array.from(Array(largestCount + 3 - String(kh.count).length)).join(
      ' '
    )}${kh.uniqueCount}`
    if (i < khBreakdown.length - 1) description += `\n` // Add extra space between
  })
  description += `\`\`\``

  return {
    title: `Locktober 2020 Stats`,
    description: description,
    color: 14553782,
    timestamp: cachedTimestamp,
    footer: {
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routerStats.performance}ms :: Requested By ${routerStats.user} :: Cached by Kiera`
    }
  }
}
