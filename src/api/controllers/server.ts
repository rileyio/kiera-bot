import * as Middleware from '@/api/middleware'
import * as Validation from '@/api/validations'
import * as errors from 'restify-errors'

import { WebRoute, WebRouted } from '@/api/web-router'

import { ObjectId } from 'bson'
import { validate } from '@/api/utils/validate'

export const Routes: Array<WebRoute> = [
  // * Server Settings * //
  {
    controller: settings,
    method: 'post',
    middleware: [Middleware.isAuthenticatedOwner],
    name: 'server-get-settings',
    path: '/api/server/settings'
  },
  {
    controller: updateSettings,
    method: 'post',
    middleware: [Middleware.isAuthenticatedOwner],
    name: 'server-update-setting',
    path: '/api/server/setting/update'
  }
]

export async function settings(routed: WebRouted) {
  const v = await validate(Validation.Server.getSettings(), routed.req.body)
  // this.DEBUG_WEBAPI('req params', v.o)
  if (v.valid) {
    return routed.res.send(
      await routed.Bot.DB.getMultiple('server-settings', {
        serverID: v.o.serverID
      })
    )
  }

  // On error
  return routed.next(new errors.BadRequestError())
}

export async function updateSettings(routed: WebRouted) {
  const v = await validate(Validation.Server.updateSetting(), routed.req.body)

  // console.log('req params', v)

  if (v.valid) {
    const updateCount = await routed.Bot.DB.update(
      'server-settings',
      v.o._id ? { _id: new ObjectId(v.o._id) } : { serverID: v.o.serverID },
      {
        $set: {
          key: 'server.channel.notification.block',
          state: v.o.state,
          type: 'string',
          value: v.o.value
        }
      },
      { atomic: true, upsert: true }
    )

    if (updateCount > 0) return routed.res.send({ status: 'updated', success: true })
    return routed.res.send({ status: 'failed', success: false })
  }

  // On error
  return routed.next(new errors.BadRequestError())
}
