import * as Middleware from '@/middleware'
import { RouterRouted, ExportRoutes } from '@/router'
import { searchResults } from '@/embedded/chastikey-search'
import { TrackedBotSetting } from '@/objects/setting'
import { UserData } from 'chastikey.js/app/objects'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'ChastiKey',
  controller: search,
  description: 'Help.ChastiKey.UsernameSearch.Description',
  example: '{{prefix}}ck search UsernameHere',
  name: 'ck-search-username',
  validate: '/ck:string/search:string/like=string',
  middleware: [Middleware.isCKVerified],
  permissions: {
    defaultEnabled: true,
    serverOnly: true
  }
})

export async function search(routed: RouterRouted) {
  const usernameRegex = new RegExp(routed.v.o.like, 'i')

  // Search for users, Exluding those who requested to hide their stats
  var ckUsers = await routed.bot.DB.aggregate<UserData>('ck-users', [
    {
      $match: { username: usernameRegex }
    },
    { $sort: { discordID: -1, username: 1 } }
  ])

  // Set cached timestamp for running locks
  const cachedTimestampFromFetch = new TrackedBotSetting(await routed.bot.DB.get('settings', { key: 'bot.task.chastikey.api.fetch.ChastiKeyAPIRunningLocks' }))
  const cachedTimestamp = cachedTimestampFromFetch.value

  ckUsers = ckUsers.map(ckUser => {
    return new UserData(ckUser)
  })
  await routed.message.channel.send(searchResults(ckUsers, routed.routerStats, cachedTimestamp))
  return true
}
