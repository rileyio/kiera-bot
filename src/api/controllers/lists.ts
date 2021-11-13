import * as Validation from '@/api/validations'
import * as errors from 'restify-errors'

import { WebRoute, WebRouted } from '@/api/web-router'

import { validate } from '@/api/utils/validate'

export const Routes: Array<WebRoute> = [
  // * Lists **/
  {
    controller: get,
    method: 'post',
    name: 'lists-get',
    path: '/api/lists'
  }
]

export async function get(routed: WebRouted) {
  const v = await validate(Validation.Lists.get(), routed.req.body)
  const payload = {
    servers: [],
    users: []
  }

  // this.DEBUG_WEBAPI('req params', v.o)

  if (v.valid) {
    const users = await routed.Bot.DB.getMultiple(
      'users',
      {
        username: { $options: 'i', $regex: new RegExp(`^${v.o.input}`) }
      },
      { discriminator: 1, username: 1 }
    )
    const servers = await routed.Bot.DB.getMultiple(
      'servers',
      {
        name: { $options: 'i', $regex: new RegExp(`^${v.o.input}`) }
      },
      { name: 1, ownerID: 1, region: 1 }
    )

    payload.servers = servers
    payload.users = users

    return routed.res.send(payload)
  }

  // On error
  return routed.next(new errors.BadRequestError())
}
