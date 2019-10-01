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
  const isVerifiedLockee = await routed.bot.DB.verify('ck-lockees', { discordID: Number(routed.user.id) })
  const isVerifiedKH = await routed.bot.DB.verify('ck-keyholders', { discordID: Number(routed.user.id) })
  const isVerified = isVerifiedLockee || isVerifiedKH
  // Get Locktober stats from DB
  const stored = await routed.bot.DB.getMultiple<{ username: string, discordID: number }>('ck-locktober', { discordID: { $ne: null } })

  // Are you (the person calling the command) apart of that list?
  const apartOfLocktober = stored.findIndex(lockee => lockee.discordID === Number(routed.user.id)) > -1

  await routed.message.channel.send(locktoberStats(stored.length, apartOfLocktober, isVerified))
  // Successful end
  return true
}
