import * as Agenda from 'agenda'

import { RoutedInteraction } from '@/router'
import { embed } from '@/commands/chastikey/locktober.embed'

/**
 * Get some totals stats on Locktober event
 * @export
 * @param {RouterRouted} routed
 */
export async function stats(routed: RoutedInteraction) {
  const verifiedCount = await routed.bot.DB.count('ck-users', { discordID: { $ne: null } })
  // Get Locktober stats from DB
  const stored = await routed.bot.DB.getMultiple('ck-locktober-2021', { discordID: { $ne: '' } })
  // Get Eligible user's locks from DB
  const queryIDs = stored.map((s) => s.discordID)
  const breakdownByKH = await routed.bot.DB.aggregate<{ _id: string; count: number; uniqueCount: number }>('ck-running-locks', [
    { $match: { discordID: { $in: queryIDs } } },
    {
      $group: {
        _id: '$lockedBy',
        count: {
          $sum: 1
        },
        locks: {
          $addToSet: '$secondsLocked'
        }
      }
    },
    {
      $project: {
        _id: 1,
        count: 1,
        // eslint-disable-next-line sort-keys
        uniqueCount: {
          $cond: {
            else: 0,
            if: {
              $isArray: '$locks'
            },
            then: {
              $size: '$locks'
            }
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ])

  // Cleanup any blank KH name if found
  breakdownByKH.map((kh) => {
    kh._id = kh._id === '' ? '<Self*>' : kh._id
  })

  // Are you (the person calling the command) apart of that list?
  const apartOfLocktober = stored.findIndex((lockee) => lockee.discordID === routed.author.id) > -1

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = (await routed.bot.DB.get('scheduled-jobs', { name: 'ChastiKeyAPILocktober2021' })) as Agenda.JobAttributes
  const cachedTimestamp = cachedTimestampFromFetch.lastFinishedAt

  return await routed.reply({
    embeds: [embed({ participants: stored.length, verified: verifiedCount }, breakdownByKH, apartOfLocktober, true, routed.routerStats, cachedTimestamp)]
  })
  // Successful end
}
