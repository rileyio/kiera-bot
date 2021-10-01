import * as Agenda from 'agenda'
import * as Middleware from '@/middleware'
import { RouterRouted, ExportRoutes } from '@/router'
import { locktoberStats } from '@/embedded/chastikey-locktober'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'ChastiKey',
  controller: statsLocktober,
  description: 'Help.ChastiKey.LocktoberStats.Description',
  example: '{{prefix}}ck stats locktober',
  name: 'ck-stats-locktober',
  validate: '/ck:string/stats:string/locktober:string',
  middleware: [Middleware.isCKVerified],
  permissions: {
    defaultEnabled: true,
    serverOnly: false
  }
})

/**
 * Get some totals stats on Locktober event
 * @export
 * @param {RouterRouted} routed
 */
export async function statsLocktober(routed: RouterRouted) {
  const verifiedCount = await routed.bot.DB.count('ck-users', { discordID: { $ne: null } })
  // Get Locktober stats from DB
  const stored = await routed.bot.DB.getMultiple<{ username: string; discordID: string }>('ck-locktober-2020', { discordID: { $ne: '' } })
  // Get Eligible user's locks from DB
  const queryIDs = stored.map((s) => s.discordID)
  const breakdownByKH = await routed.bot.DB.aggregate<{ _id: string; count: number; uniqueCount: number }>('ck-running-locks', [
    { $match: { discordID: { $in: queryIDs } } },
    {
      $group: {
        _id: '$lockedBy',
        locks: {
          $addToSet: '$secondsLocked'
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 1,
        uniqueCount: { $cond: { if: { $isArray: '$locks' }, then: { $size: '$locks' }, else: 0 } },
        count: 1
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
  const cachedTimestampFromFetch = (await routed.bot.DB.get('scheduled-jobs', { name: 'ChastiKeyAPILocktober2020' })) as Agenda.JobAttributes
  const cachedTimestamp = cachedTimestampFromFetch.lastFinishedAt

  await routed.message.channel.send({
    embeds: [locktoberStats({ participants: stored.length, verified: verifiedCount }, breakdownByKH, apartOfLocktober, true, routed.routerStats, cachedTimestamp)]
  })
  // Successful end
  return true
}
