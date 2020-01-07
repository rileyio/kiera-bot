import { WebRouted } from '@/api/web-router'

export namespace ChastiKeyWebStats {
  export async function locks(routed: WebRouted) {
    // Get latest compiled Stats from DB
    const latestFromDB = await routed.Bot.DB.getLatest('ck-stats-hourly', {})
    const latest = latestFromDB[0]

    // Get date & times available for historical
    const historicalDates = await routed.Bot.DB.aggregate('ck-stats-hourly', [
      {
        $addFields: {
          dateTime: { $toDate: '$_id' }
        }
      },
      {
        $project: {
          _id: 0,
          dateTime: 1
        }
      }
    ])

    // Add historical stats ranges to latest
    latest['historical'] = historicalDates

    return routed.res.json(latest)
  }
}
