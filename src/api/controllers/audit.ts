import * as Middleware from '@/api/middleware'
import { WebRoute, WebRouted } from '@/api/web-router'

export const Routes: Array<WebRoute> = [
  {
    controller: getEntries,
    method: 'post',
    middleware: [Middleware.validateSession],
    name: 'audit-log',
    path: '/api/audit'
  }
]

export async function getEntries(routed: WebRouted) {
  const auditEntries = await routed.Bot.DB.getLatest(
    'audit-log',
    {
      owner: routed.session.userID
    },
    { limit: 200 }
  )

  console.log('Audit Count:', auditEntries.length)

  return routed.res.send(auditEntries)
}
