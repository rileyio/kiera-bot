import * as Middleware from '../../middleware';
import { ExportRoutes } from '../../router/routes-exporter';
import { RouterRouted } from '../../utils';
import { TrackedChastiKeyUser } from '../../objects/chastikey';
import { searchResults } from '../../embedded/chastikey-search';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'ChastiKey',
    commandTarget: 'none',
    controller: search,
    example: '{{prefix}}ck search UsernameHere',
    name: 'ck-search-username',
    validate: '/ck:string/search:string/like=string',
    middleware: [
      Middleware.isCKVerified
    ],
    permissions: {
      defaultEnabled: true,
      serverOnly: true
    }
  }
)

export async function search(routed: RouterRouted) {
  const usernameRegex = new RegExp(routed.v.o.like, 'i')

  var ckUsers = await routed.bot.DB.aggregate<TrackedChastiKeyUser>('ck-users', [
    {
      $match: { username: usernameRegex }
    },
    { $sort: { discordID: -1, displayInStats: 1, username: 1 } }
  ])

  ckUsers = ckUsers.map(ckUser => { return new TrackedChastiKeyUser(ckUser) })
  await routed.message.channel.send(searchResults(ckUsers))
  return true
}
