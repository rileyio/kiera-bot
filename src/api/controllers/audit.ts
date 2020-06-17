import * as Middleware from '@/api/middleware'
import { WebRouted, WebRoute } from '@/api/web-router'
import { AuditEntry } from '@/objects/audit'

export const Routes: Array<WebRoute> = [
  // * Audit * //
  {
    controller: getEntries,
    method: 'post',
    name: 'audit-log',
    path: '/api/audit',
    middleware: [Middleware.validateSession]
  }
]

export async function getEntries(routed: WebRouted) {
  var auditEntries = await routed.Bot.DB.getLatest<AuditEntry>(
    'audit-log',
    {
      owner: routed.session.userID
    },
    { limit: 200 }
  )

  console.log('Audit Count:', auditEntries.length)

  return routed.res.send(auditEntries)
}
