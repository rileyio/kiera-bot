import * as Middleware from '@/api/middleware'
import { WebRouted, WebRoute } from '@/api/web-router'
import { TrackedAvailableObject } from '@/objects/available-objects'
import { TrackedUser } from '@/objects/user'

export const Routes: Array<WebRoute> = [
  // * Available * //
  {
    controller: settings,
    method: 'post',
    name: 'available-settings',
    path: '/api/available/settings',
    middleware: [Middleware.validateSession]
  },
  {
    controller: userGeneric,
    method: 'post',
    name: 'available-user',
    path: '/api/available/user',
    middleware: [Middleware.validateSession]
  }
]

export async function settings(routed: WebRouted) {
  // this.DEBUG_WEBAPI('req params', v.o)

  var templateNotifications = await routed.Bot.DB.getMultiple<TrackedAvailableObject>('available-server-settings', {}, { _id: 0 })
  return routed.res.send(templateNotifications)
}

export async function userGeneric(routed: WebRouted) {
  return routed.res.send(new TrackedUser({}))
}
