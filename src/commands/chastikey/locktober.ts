import got = require('got');
import * as FormData from 'form-data';
import * as Middleware from '../../middleware';
import * as Utils from '../../utils';
import * as Discord from 'discord.js';
import { TrackedUser } from '../../objects/user';
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
  const userArgType = Utils.User.verifyUserRefType(routed.message.author.id)
  const userQuery = Utils.User.buildUserQuery(routed.message.author.id, userArgType)
  const user = new TrackedUser(await routed.bot.DB.get<TrackedUser>('users', userQuery))

  // Get Locktober stats from DB
  const stored = await routed.bot.DB.getMultiple<{ username: string }>('ck-locktober', {})

  // Are you (the person calling the command) apart of that list?
  const apartOfLocktober = (user)
    ? (user.ChastiKey.username !== '') ? (stored.findIndex(lockee => lockee.username.toLocaleLowerCase() === user.ChastiKey.username.toLocaleLowerCase()) > -1) : false
    : false

  await routed.message.channel.send(locktoberStats(stored.length, apartOfLocktober))
  // Successful end
  return true
}
