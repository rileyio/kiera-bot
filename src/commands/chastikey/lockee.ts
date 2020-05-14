import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { ExportRoutes } from '@/router/routes-exporter'
import { RouterRouted } from '@/router'
import { lockeeHistory } from '@/embedded/chastikey-history'
import { TrackedUser } from '@/objects/user'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'ChastiKey',
  controller: history,
  example: '{{prefix}}ck lockee history',
  name: 'ck-lockee-history',
  validate: '/ck:string/lockee:string/history:string/username?=string',
  middleware: [Middleware.isCKVerified],
  permissions: {
    defaultEnabled: true,
    serverOnly: false
  }
})

export async function history(routed: RouterRouted) {
  // Get any Kiera preferences
  const kieraUser = new TrackedUser(
    (await routed.bot.DB.get('users', routed.v.o.username ? { 'ChastiKey.username': routed.v.o.username } : { id: routed.user.id })) || { __notStored: true }
  )

  // Get user from lockee data (Stats, User and Locks)
  const lockeeData = await routed.bot.Service.ChastiKey.fetchAPILockeeData({
    discordid: !routed.v.o.username
      ? routed.user.id
      : kieraUser.__notStored
      ? undefined
      : kieraUser.username.toLowerCase() === routed.v.o.username.toLowerCase()
      ? kieraUser.id
      : undefined,
    username: kieraUser.__notStored && routed.v.o.username ? routed.v.o.username : undefined,
    showDeleted: true
  })

  // If the lookup is upon someone else with no data, return the standard response
  if (lockeeData.response.status !== 200) {
    // Notify in chat what the issue could be
    await routed.message.reply(routed.$render('ChastiKey.Error.UserLookupErrorOrNotFound'))
    return true // Stop here
  }

  // If the user has display_in_stats === 2 then stop here
  if (lockeeData.data.displayInStats === 2) {
    await Utils.ChastiKey.statsDisabledError(routed)
    return true // Stop here
  }

  await routed.message.reply(lockeeHistory(lockeeData, { showRating: !kieraUser.__notStored ? kieraUser.ChastiKey.ticker.showStarRatingScore : true }, routed.routerStats))
  return true
}
