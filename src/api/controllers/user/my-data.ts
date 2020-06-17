import * as Middleware from '@/api/middleware'
import { WebRouted, WebRoute } from '@/api/web-router'

export const Routes: Array<WebRoute> = [
  {
    controller: getMyDataTotals,
    method: 'get',
    name: 'web-my-data-totals',
    path: '/api/user/mydata/totals',
    middleware: [Middleware.validateSession]
  }
]

export async function getMyDataTotals(routed: WebRouted) {
  var totals = [
    { thirdParty: false, scope: 'kiera', name: 'Audit Log', count: await routed.Bot.DB.count('audit-log', { owner: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Bot Settings', count: await routed.Bot.DB.count('settings', { author: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Command Permissions', count: await routed.Bot.DB.count('command-permissions', { userID: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Decisions', count: await routed.Bot.DB.count('decision', { authorID: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Decision Log', count: await routed.Bot.DB.count('decision-log', { callerID: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Message', count: await routed.Bot.DB.count('messages', { callerID: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Muted as User', count: await routed.Bot.DB.count('muted-users', { id: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Muted as Muter', count: await routed.Bot.DB.count('muted-users', { mutedById: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Polls', count: await routed.Bot.DB.count('polls', { authorID: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Server Settings', count: await routed.Bot.DB.count('server-settings', { authorID: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Servers as Owner', count: await routed.Bot.DB.count('servers', { owner: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Web Sessions', count: await routed.Bot.DB.count('sessions', { userID: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Stats', count: await routed.Bot.DB.count('stats-servers', { userID: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Stats Settings', count: await routed.Bot.DB.count('stats-settings', { userID: routed.session.userID }) },
    { thirdParty: false, scope: 'kiera', name: 'Users', count: await routed.Bot.DB.count('users', { id: routed.session.userID }) },
    { thirdParty: true, scope: 'chastikey', name: 'Locktober', count: await routed.Bot.DB.count('ck-locktober', { discordID: routed.session.userID }) },
    { thirdParty: true, scope: 'chastikey', name: 'Running Locks', count: await routed.Bot.DB.count('ck-running-locks', { discordID: routed.session.userID }) },
    { thirdParty: true, scope: 'chastikey', name: 'Users', count: await routed.Bot.DB.count('ck-users', { discordID: routed.session.userID }) }
  ]

  return routed.res.send({ success: true, data: totals })
}
