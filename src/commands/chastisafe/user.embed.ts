import * as Utils from '@/utils'

import { ChastiSafeUser } from '@/objects/chastisafe'
import { EmbedBuilder } from 'discord.js'
import { Routed } from '@/router'

export function embed(user: ChastiSafeUser, routed: Routed<'discord-chat-interaction'>) {
  const description = routed.$render(
    'ChastiSafe.Stats.User.MainStats',
    Object.assign(
      {
        averageRatingAsKeyholder: user.ratings.averageRatingAsKeyholder || 'n/a',
        averageRatingAsLockee: user.ratings.averageRatingAsLockee || 'n/a',
        bondageLevel: user.levels.bondageLevel ? user.levels.bondageLevel : 'n/a',
        chastityLevel: user.levels.chastityLevel ? user.levels.chastityLevel : 'n/a',
        chastityLocks: user.lockInfo.chastityLocks.map((l) => `🔒 **${l.lockName}**\n**Keyholder:** \`${l.keyholder}\`\n**Loaded:** \`${l.loadtime}\``),
        hasActiveChastityLocks: user.lockInfo.chastityLocks.length > 0,
        hasChastiKeyData: user.hasChastiKeyData,
        keyholderLevelBondage: user.keyholderLevels.bondageLevel ? user.keyholderLevels.bondageLevel : 'n/a',
        keyholderLevelChastity: user.keyholderLevels.chastityLevel ? user.keyholderLevels.chastityLevel : 'n/a',
        keyholderLevelTask: user.keyholderLevels.taskLevel ? user.keyholderLevels.taskLevel : 'n/a',
        ratingsAsKeyholderCount: user.ratings.ratingsAsKeyholderCount,
        ratingsAsLockeeCount: user.ratings.ratingsAsLockeeCount,
        taskLevel: user.levels.taskLevel ? user.levels.taskLevel : 'n/a'
      },
      // Only include this if ChastiKey data is available
      user.hasChastiKeyData
        ? {
            averageKeyholderRating: user.chastikeystats.averageKeyholderRating,
            averageLockeeRating: user.chastikeystats.averageLockeeRating,
            averageTimeLocked: Utils.Date.calculateHumanTimeDDHHMM(user.chastikeystats.averageTimeLockedInSeconds),
            cumulativeSecondsLocked: Math.round((user.chastikeystats.cumulativeSecondsLocked / 2592000) * 100) / 100,
            hasKeyholderRatings: user.chastikeystats.averageKeyholderRating !== 0,
            hasLockeeRatings: user.chastikeystats.averageLockeeRating > 0,
            hasManagedLocks: user.chastikeystats.totalLocksManaged > 0,
            joinTimestamp: user.chastikeystats.joinTimestamp.substring(0, 10),
            joinedDaysAgo: `${Math.round((Date.now() - new Date(user.chastikeystats.joinTimestamp).getTime()) / 1000 / 60 / 60 / 24)}`,
            keyheldStartTimestamp: user.chastikeystats.keyheldStartTimestamp ? user.chastikeystats.keyheldStartTimestamp.substring(0, 10) : 'n/a',
            longestLockCompleted: Utils.Date.calculateHumanTimeDDHHMM(user.chastikeystats.longestCompletedLockInSeconds),
            noOfKeyholderRatings: user.chastikeystats.noOfKeyholderRatings,
            numberOfCompletedLocks: user.chastikeystats.numberOfCompletedLocks,
            numberOfLockeeRatings: user.chastikeystats.numberOfLockeeRatings,
            totalLocksManaged: user.chastikeystats.totalLocksManaged
          }
        : {}
    )
  )

  return new EmbedBuilder()
    .setColor(9125611)
    .setDescription(description)
    .setFooter({
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routed.routerStats.performance}ms :: Requested By ${routed.routerStats.user} :: Retrieved by Kiera`
    })
    .setTitle(
      routed.$render('ChastiSafe.Stats.User.Title', {
        username: user.user,
        verifiedEmoji: '<:verified:625628727820288000> '
      })
    )
    .setTimestamp(Date.now())
}
