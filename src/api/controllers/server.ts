import * as errors from 'restify-errors'
import * as Middleware from '@/api/middleware'
import * as Validation from '@/api/validations'
import { validate } from '@/api/utils/validate'
import { WebRouted, WebRoute } from '@/api/web-router'
import { ObjectID } from 'bson'
import { TrackedServerSetting } from '@/objects/server-setting'

export const Routes: Array<WebRoute> = [
  // * Server Settings * //
  {
    controller: settings,
    method: 'post',
    name: 'server-get-settings',
    path: '/api/server/settings',
    middleware: [Middleware.isAuthenticatedOwner]
  },
  {
    controller: updateSettings,
    method: 'post',
    name: 'server-update-setting',
    path: '/api/server/setting/update',
    middleware: [Middleware.isAuthenticatedOwner]
  }
]

export async function settings(routed: WebRouted) {
  const v = await validate(Validation.Server.getSettings(), routed.req.body)

  // this.DEBUG_WEBAPI('req params', v.o)

  if (v.valid) {
    var serverSettings = await routed.Bot.DB.getMultiple<TrackedServerSetting>('server-settings', {
      serverID: v.o.serverID
    })

    return routed.res.send(serverSettings)
  }

  // On error
  return routed.next(new errors.BadRequestError())
}

export async function updateSettings(routed: WebRouted) {
  const v = await validate(Validation.Server.updateSetting(), routed.req.body)

  // console.log('req params', v)

  if (v.valid) {
    var updateCount = await routed.Bot.DB.update<TrackedServerSetting>(
      'server-settings',
      v.o._id ? { _id: new ObjectID(v.o._id) } : { serverID: v.o.serverID },
      {
        $set: {
          key: 'server.channel.notification.block',
          type: 'string',
          state: v.o.state,
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
