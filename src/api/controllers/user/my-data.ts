import * as Middleware from '@/api/middleware'

import { WebRoute, WebRouted } from '@/api/web-router'

export const Routes: Array<WebRoute> = [
  {
    controller: getMyDataTotals,
    method: 'get',
    middleware: [Middleware.validateSession],
    name: 'web-my-data-totals',
    path: '/api/user/mydata/totals'
  }
]

export async function getMyDataTotals(routed: WebRouted) {
  return routed.res.send({
    data: [
      { count: await routed.Bot.DB.count('audit-log', { owner: routed.session.userID }), name: 'Audit Log', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('settings', { author: routed.session.userID }), name: 'Bot Settings', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('command-permissions', { userID: routed.session.userID }), name: 'Command Permissions', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('decision', { authorID: routed.session.userID }), name: 'Decisions', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('decision-log', { callerID: routed.session.userID }), name: 'Decision Log', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('messages', { callerID: routed.session.userID }), name: 'Message', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('muted-users', { id: routed.session.userID }), name: 'Muted as User', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('muted-users', { mutedById: routed.session.userID }), name: 'Muted as Muter', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('polls', { authorID: routed.session.userID }), name: 'Polls', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('server-settings', { authorID: routed.session.userID }), name: 'Server Settings', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('servers', { owner: routed.session.userID }), name: 'Servers as Owner', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('sessions', { userID: routed.session.userID }), name: 'Web Sessions', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('stats-servers', { userID: routed.session.userID }), name: 'Stats', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('stats-settings', { userID: routed.session.userID }), name: 'Stats Settings', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('users', { id: routed.session.userID }), name: 'Users', scope: 'kiera', thirdParty: false },
      { count: await routed.Bot.DB.count('ck-locktober-2019', { discordID: routed.session.userID }), name: 'Locktober 2019', scope: 'chastikey', thirdParty: true },
      { count: await routed.Bot.DB.count('ck-locktober-2020', { discordID: routed.session.userID }), name: 'Locktober 2020', scope: 'chastikey', thirdParty: true },
      { count: await routed.Bot.DB.count('ck-locktober-2021', { discordID: routed.session.userID }), name: 'Locktober 2021', scope: 'chastikey', thirdParty: true },
      { count: await routed.Bot.DB.count('ck-running-locks', { discordID: routed.session.userID }), name: 'Running Locks', scope: 'chastikey', thirdParty: true },
      { count: await routed.Bot.DB.count('ck-users', { discordID: routed.session.userID }), name: 'Users', scope: 'chastikey', thirdParty: true }
    ],
    success: true
  })
}
