import * as Middleware from '../../middleware';
import { RouterRouted } from '../../router/router';
import { ExportRoutes } from '../../router/routes-exporter';
import { locktoberStats } from '../../embedded/chastikey-locktober';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'author',
    controller: statsLocktober,
    example: '{{prefix}}ck stats locktober',
    name: 'ck-stats-locktober',
    validate: '/ck:string/stats:string/locktober:string',
    middleware: [
      Middleware.isUserRegistered
    ],
    permissions: {
      defaultEnabled: true,
      serverOnly: false
    }
  },
)

/**
 * Get some totals stats on Locktober event
 * @export
 * @param {RouterRouted} routed
 */
export async function statsLocktober(routed: RouterRouted) {
  const isVerified = await routed.bot.DB.verify('ck-users', { discordID: Number(routed.user.id) })
  const verifiedCount = await routed.bot.DB.count('ck-users', { discordID: { $ne: null } })
  // Get Locktober stats from DB
  const stored = await routed.bot.DB.getMultiple<{ username: string, discordID: number }>('ck-locktober', { discordID: { $ne: null } })
  // Get Eligible user's locks from DB
  const queryIDs = stored.map(s => s.discordID)
  const breakdownByKH = await routed.bot.DB.aggregate<{ _id: string, count: number, uniqueCount: number }>('ck-running-locks', [
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
    { $sort: { count: -1 } }])

  // Cleanup any blank KH name if found
  breakdownByKH.map(kh => {
    kh._id = kh._id === '' ? '<Self*>' : kh._id
  })

  // console.log('!!isVerified', isVerified)
  // console.log('!!stored.length', stored.length)
  // console.log('!!verifiedCount', verifiedCount)
  // console.log('!!breakdownByKH', breakdownByKH)
  // console.log(JSON.stringify(queryIDs))

  // Are you (the person calling the command) apart of that list?
  const apartOfLocktober = stored.findIndex(lockee => lockee.discordID === Number(routed.user.id)) > -1

  await routed.message.channel.send(locktoberStats({ participants: stored.length, verified: verifiedCount }, breakdownByKH, apartOfLocktober, isVerified))
  // Successful end
  return true
}
