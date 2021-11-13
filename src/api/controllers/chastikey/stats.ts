import * as Validation from '@/api/validations'

import { WebRoute, WebRouted } from '@/api/web-router'

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
  const v =
    routed.req.body === {}
      ? {
          o: null,
          valid: true
        }
      : await validate(Validation.ChastiKey.globalStats(), routed.req.body)
  console.log(v, v.o !== null ? typeof v.o.date : null)
  const dateSpecified = v.valid
  // Get latest compiled Stats from DB
  const fromDB = dateSpecified
    ? await routed.Bot.DB.aggregate('ck-stats-daily', [
        { $match: { date: v.o.date } },
        {
          $project: {
            _id: 0,
            date: 1,
            dateTime: 1,
            interval: 1,
            stats: {
              botLocks: 1,
              botTrust: 1,
              distributionByCardsRemaining: 1,
              distributionByInterval: 1,
              distributionByLockedTimeFixed: 1,
              distributionByLockedTimeFixedTrusted: 1,
              distributionByLockedTimeVariable: 1,
              distributionByLockedTimeVariableTrusted: 1,
              fixedLocks: 1,
              frozenLocks: 1,
              keyholderAvgRating: 1,
              keyholderLocks: 1,
              keyholderTrust: 1,
              keyholdersCount: 1,
              selfLocks: 1,
              totalLocks: 1,
              variableLocks: 1
            }
          }
        }
      ])
    : await routed.Bot.DB.getLatest('ck-stats-daily', {})

  const latest = fromDB[0]
  const khFromDB = await routed.Bot.DB.aggregate('ck-stats-daily', [
    { $match: { dateTime: latest.dateTime } },
    { $project: { _id: 0, keyholders: '$stats.keyholders' } },
    { $unwind: '$keyholders' },
    { $replaceRoot: { newRoot: '$keyholders' } },
    {
      $lookup: {
        as: 'keyholder',
        foreignField: 'userID',
        from: 'ck-users',
        localField: 'keyholder'
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
        averageKeyholderRating: 1,
        fixed: 1,
        frozen: 1,
        infoHidden: 1,
        keyholder: '$keyholder.username',
        level: 1,
        runningLocks: 1,
        // lockees: '$lockees.username',
        secondsLocked: 1,
        trust: 1,
        uniqueLockeeCount: {
          $cond: {
            else: 0,
            if: {
              $isArray: '$lockees'
            },
            then: {
              $size: '$lockees'
            }
          }
        },
        variable: 1
      }
    },
    { $sort: { uniqueLockeeCount: -1 } }
  ])

  // Get date & times available for historical
  const historicalDates = await routed.Bot.DB.aggregate<{ date: string }>('ck-stats-daily', [
    {
      $addFields: {
        date: '$date'
      }
    },
    {
      $sort: { date: -1 }
    },
    {
      $project: {
        _id: 0,
        date: 1
      }
    }
  ])

  // Map KH Data
  latest['keyholders'] = khFromDB

  // Add historical stats ranges to latest
  latest['ranges'] = historicalDates.map((d: { date: string }) => `${new Date(d.date).toISOString()}`)

  return routed.res.json(latest)
}
