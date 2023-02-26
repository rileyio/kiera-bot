/* eslint-disable sort-keys */
import * as Utils from '@/utils'

import { ChastiSafeUser } from '@/objects/chastisafe'
import { EmbedBuilder } from 'discord.js'
import { Routed } from '@/router'

export function embed(user: ChastiSafeUser, routed: Routed<'discord-chat-interaction'>) {
  const data = {
    averageRatingAsKeyholder: user.ratings.averageRatingAsKeyholder || '--',
    averageRatingAsLockee: user.ratings.averageRatingAsLockee || '--',
    chastityLocks: user.lockInfo.chastityLocks.map((l) => `🔒 **${l.lockName}**\n**Keyholder:** \`${l.keyholder}\`\n**Loaded:** \`${l.loadtime}\``),
    hasActiveChastityLocks: user.lockInfo.chastityLocks.length > 0,
    hasChastiKeyData: user.hasChastiKeyData,
    // Do they have any levels or kh counts (categories)
    hasKeyholderLevels: 'bondageLevel' in user.keyholderLevels || 'chastityLevel' in user.keyholderLevels || 'taskLevel' in user.keyholderLevels,
    hasLevels: 'bondageLevel' in user.levels || 'chastityLevel' in user.levels || 'taskLevel' in user.levels,
    hasRatings: user.ratings.averageRatingAsKeyholder || user.ratings.averageRatingAsLockee,
    // Lockee Level Values (strings)
    lockeeLevelBondage: user.levels.bondageLevel ? user.levels.bondageLevel : null,
    lockeeLevelChastity: user.levels.chastityLevel ? user.levels.chastityLevel : null,
    lockeeLevelTask: user.levels.taskLevel ? user.levels.taskLevel : null,
    // Lockee Levels (boolean)
    hasLockeeLevelBondage: 'bondageLevel' in user.levels,
    hasLockeeLevelChastity: 'chastityLevel' in user.levels,
    hasLockeeLevelTask: 'taskLevel' in user.levels,
    // KH Level Values (strings)
    keyholderLevelBondage: user.keyholderLevels.bondageLevel ? user.keyholderLevels.bondageLevel : null,
    keyholderLevelChastity: user.keyholderLevels.chastityLevel ? user.keyholderLevels.chastityLevel : null,
    keyholderLevelTask: user.keyholderLevels.taskLevel ? user.keyholderLevels.taskLevel : null,
    // KH Levels (boolean)
    hasKeyholderLevelBondage: 'bondageLevel' in user.keyholderLevels,
    hasKeyholderLevelChastity: 'chastityLevel' in user.keyholderLevels,
    hasKeyholderLevelTask: 'taskLevel' in user.keyholderLevels,
    // Ratings counts
    ratingsAsKeyholderCount: user.ratings.ratingsAsKeyholderCount,
    ratingsAsLockeeCount: user.ratings.ratingsAsLockeeCount
  }

  // Only include this if ChastiKey data is available
  const chastikey = data.hasChastiKeyData
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

  let body = `**ChastiSafe User Statistics**`

  if (data.hasLevels) {
    body += '\n\n **Lockee Levels**'
    if (data.hasLockeeLevelChastity) body += `\n● ${data.lockeeLevelChastity || ''} Chastity`
    if (data.hasLockeeLevelBondage) body += `\n● ${data.lockeeLevelBondage || ''} Bondage`
    if (data.hasLockeeLevelTask) body += `\n● ${data.lockeeLevelTask || ''} Task`
  }

  if (data.hasKeyholderLevels) {
    body += '\n\n**Keyholder Levels**'
    if (data.hasKeyholderLevelChastity) body += `\n● ${data.keyholderLevelChastity || ''} Keyholder`
    if (data.hasKeyholderLevelBondage) body += `\n● ${data.keyholderLevelBondage || ''} Bondage Puppeteer`
    if (data.hasKeyholderLevelTask) body += `\n● ${data.keyholderLevelTask || ''} Task Director`
  }

  if (data.hasRatings) {
    body += '\n\n**Ratings**'
    if (data.ratingsAsKeyholderCount > 0) body += `\nKeyholder Avg \`${data.averageRatingAsKeyholder}\` | Count \`${data.ratingsAsKeyholderCount}\``
    if (data.ratingsAsLockeeCount > 0) body += `\nLockee Avg \`${data.averageRatingAsLockee}\` | Count \`${data.ratingsAsLockeeCount}\``
  }

  if (data.hasActiveChastityLocks) {
    body += '\n\n**Active Locks**'
    data.chastityLocks.forEach((lock) => {
      body += `\n${lock}`
      body += '\n───────────────'
    })
  }

  if (data.hasChastiKeyData) {
    body += '\n\n**ChastiKey (Legacy)**'
    body += `\nAvg Keyholder Rating \`${chastikey.hasKeyholderRatings ? chastikey.averageKeyholderRating : '--'}\` ● # Ratings \`${chastikey.noOfKeyholderRatings}\``
    body += `\nAvg Lockee Rating \`${chastikey.hasLockeeRatings ? chastikey.averageLockeeRating : '--'}\` ● # Ratings \`${chastikey.numberOfLockeeRatings}\``
    body += `\nLocked for \`${chastikey.cumulativeSecondsLocked}\` months to date ● \`${chastikey.numberOfCompletedLocks}\` locks completed`
    body += `\nLongest (completed) \`${chastikey.longestLockCompleted}\``
    body += `\nAverage Time Locked (overall) \`${chastikey.averageTimeLocked}\``
    body += `\nDate First Keyheld \`${chastikey.keyheldStartTimestamp}\``
    body += `\nJoined \`${chastikey.joinTimestamp}\``
  }

  return new EmbedBuilder()
    .setColor(9125611)
    .setDescription(body)
    .setFooter({
      iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
      text: `Runtime ${routed.routerStats.performance}ms :: Requested By ${routed.routerStats.user} :: Retrieved by Kiera`
    })
    .setTitle(`**${user.user}**`)
    .setTimestamp(Date.now())
}
