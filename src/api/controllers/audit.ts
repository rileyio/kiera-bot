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
  // const v = await validate(Validation.Audit.getAll(), routed.req.body)
  // User & Token from header
  const id = routed.req.header('id')

  var auditEntries = await routed.Bot.DB.getMultiple<AuditEntry>('audit-log', {
    owner: id
  })

  // Sort Desc on date
  auditEntries.reverse()

  return routed.res.send(auditEntries)
}
