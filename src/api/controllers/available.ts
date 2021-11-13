import * as Middleware from '@/api/middleware';

import { WebRoute, WebRouted } from '@/api/web-router';

import { TrackedUser } from '@/objects/user/';

export const Routes: Array<WebRoute> = [
  {
    controller: settings,
    method: 'post',
    middleware: [Middleware.validateSession],
    name: 'available-settings',
    path: '/api/available/settings'
  },
  {
    controller: userGeneric,
    method: 'post',
    middleware: [Middleware.validateSession],
    name: 'available-user',
    path: '/api/available/user'
  }
]

export async function settings(routed: WebRouted) {
  // this.DEBUG_WEBAPI('req params', v.o)
  const templateNotifications = await routed.Bot.DB.getMultiple('available-server-settings', {}, { _id: 0 })
  return routed.res.send(templateNotifications)
}

export async function userGeneric(routed: WebRouted) {
  return routed.res.send(new TrackedUser({}))
}
