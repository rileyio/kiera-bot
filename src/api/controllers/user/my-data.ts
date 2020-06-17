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
  const totals = {
    kiera: {
      auditLog: await routed.Bot.DB.count('audit-log', { owner: routed.session.userID }),
      botSettings: await routed.Bot.DB.count('settings', { author: routed.session.userID }),
      commandPermissions: await routed.Bot.DB.count('command-permissions', { userID: routed.session.userID }),
      decision: await routed.Bot.DB.count('decision', { authorID: routed.session.userID }),
      decisionLog: await routed.Bot.DB.count('decision-log', { callerID: routed.session.userID }),
      messages: await routed.Bot.DB.count('messages', { callerID: routed.session.userID }),
      mutedUsersAsUser: await routed.Bot.DB.count('muted-users', { id: routed.session.userID }),
      mutedUsersAsMuter: await routed.Bot.DB.count('muted-users', { mutedById: routed.session.userID }),
      polls: await routed.Bot.DB.count('polls', { authorID: routed.session.userID }),
      serverSettings: await routed.Bot.DB.count('server-settings', { authorID: routed.session.userID }),
      serversAsOwner: await routed.Bot.DB.count('servers', { owner: routed.session.userID }),
      sessions: await routed.Bot.DB.count('sessions', { userID: routed.session.userID }),
      stats: await routed.Bot.DB.count('stats-servers', { userID: routed.session.userID }),
      statsSettings: await routed.Bot.DB.count('stats-settings', { userID: routed.session.userID }),
      users: await routed.Bot.DB.count('users', { id: routed.session.userID })
    },
    thirdParty: {
      chastikey: {
        locktober: await routed.Bot.DB.count('ck-locktober', { discordID: routed.session.userID }),
        runningLocks: await routed.Bot.DB.count('ck-running-locks', { discordID: routed.session.userID }),
        users: await routed.Bot.DB.count('ck-users', { discordID: routed.session.userID })
      }
    }
  }

  return routed.res.send({ success: true, data: totals })
}
