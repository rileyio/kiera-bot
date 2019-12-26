import got = require('got')
import * as Middleware from '@/middleware'
import * as Utils from '@/utils'
import { ExportRoutes } from '@/router/routes-exporter'
import { RouterRouted } from '@/router'
import { lockeeHistory } from '@/embedded/chastikey-history'
import { TrackedUser } from '@/objects/user'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'ChastiKey',
  commandTarget: 'none',
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
  const kieraUser = new TrackedUser((await routed.bot.DB.get('users', routed.v.o.username ? { 'ChastiKey.username': routed.v.o.username } : { id: routed.user.id })) || { __notStored: true })

  // Get user from lockee data (Stats, User and Locks)
  const lockeeData = await routed.bot.Service.ChastiKey.fetchAPILockeeData({
    discordid: !routed.v.o.username ? routed.user.id : kieraUser.__notStored ? undefined : kieraUser.username.toLowerCase() === routed.v.o.username.toLowerCase() ? kieraUser.id : undefined,
    username: kieraUser.__notStored && routed.v.o.username ? routed.v.o.username : undefined,
    showDeleted: true
  })

  // If user has displayInStats set to false
  if (!lockeeData.data.displayInStats) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.userRequestedNoStats))
    return true // Stop here
  }

  if (lockeeData.response.status !== 200) {
    await routed.message.reply(Utils.sb(Utils.en.chastikey.userNotFoundRemote))
    return true
  }

  await routed.message.reply(lockeeHistory(lockeeData, { showRating: !kieraUser.__notStored ? kieraUser.ChastiKey.ticker.showStarRatingScore : true }, routed.routerStats))
  return true
}
