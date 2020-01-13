import * as Validation from '@/api/validations'
import { WebRouted, WebRoute } from '@/api/web-router'
import { validate } from '@/api/utils/validate'

export const Routes: Array<WebRoute> = [
  // * Kiera+CK Stats * //
  {
    controller: locks,
    method: 'post',
    name: 'ck-stats-locks',
    path: '/api/ck/stats/locks'
  }
]

export async function locks(routed: WebRouted) {
  const v = routed.req.body === {} ? { valid: true, o: null } : await validate(Validation.ChastiKey.globalStats(), routed.req.body)
  const dateTimeSpecified = v.valid
  // Get latest compiled Stats from DB
  const fromDB = dateTimeSpecified
    ? await routed.Bot.DB.aggregate<any>('ck-stats-hourly', [
        { $match: { dateTime: String(new Date(v.o.dateTime).toISOString()) } },
        {
          $project: {
            _id: 0,
            interval: 1,
            dateTime: 1,
            stats: {
              distributionByInterval: 1,
              totalLocks: 1,
              keyholderTrust: 1,
              botTrust: 1,
              fixedLocks: 1,
              frozenLocks: 1,
              variableLocks: 1,
              keyholderLocks: 1,
              selfLocks: 1,
              botLocks: 1,
              keyholdersCount: 1,
              keyholderRating: 1,
              distributionByLockedTimeFixed: 1,
              distributionByLockedTimeFixedTrusted: 1,
              distributionByLockedTimeVariable: 1,
              distributionByLockedTimeVariableTrusted: 1,
              distributionByCardsRemaining: 1
            }
          }
        }
      ])
    : await routed.Bot.DB.getLatest('ck-stats-hourly', {})

  const latest = fromDB[0]
  const khFromDB = await routed.Bot.DB.aggregate('ck-stats-hourly', [
    { $match: { dateTime: latest.dateTime } },
    { $project: { _id: 0, keyholders: '$stats.keyholders' } },
    { $unwind: '$keyholders' },
    { $replaceRoot: { newRoot: '$keyholders' } },
    {
      $lookup: {
        from: 'ck-users',
        localField: 'keyholder',
        foreignField: 'userID',
        as: 'keyholder'
      }
    },
    // {
    //   $lookup: {
    //     from: 'ck-users',
    //     localField: 'lockees',
    //     foreignField: 'userID',
    //     as: 'lockees'
    //   }
    // },
    { $unwind: '$keyholder' },
    {
      $project: {
        _id: 0,
        keyholder: '$keyholder.username',
        level: 1,
        averageKeyholderRating: 1,
        uniqueLockeeCount: { $cond: { if: { $isArray: '$lockees' }, then: { $size: '$lockees' }, else: 0 } },
        runningLocks: 1,
        fixed: 1,
        variable: 1,
        infoHidden: 1,
        trust: 1,
        frozen: 1,
        // lockees: '$lockees.username',
        secondsLocked: 1
      }
    },
    { $sort: { uniqueLockeeCount: -1 } }
  ])

  // Get date & times available for historical
  const historicalDates = await routed.Bot.DB.aggregate('ck-stats-hourly', [
    {
      $addFields: {
        dateTime: '$dateTime'
      }
    },
    {
      $sort: { dateTime: -1 }
    },
    {
      $project: {
        _id: 0,
        dateTime: 1
      }
    }
  ])

  // Map KH Data
  latest['keyholders'] = khFromDB

  // Add historical stats ranges to latest
  latest['ranges'] = historicalDates.map((d: { dateTime: string }) => `${new Date(d.dateTime).toISOString()}`)

  return routed.res.json(latest)
}
