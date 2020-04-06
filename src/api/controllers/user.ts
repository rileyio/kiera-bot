import * as errors from 'restify-errors'
import * as Middleware from '@/api/middleware'
import * as Validation from '@/api/validations'
import { validate } from '@/api/utils/validate'
import { TrackedUser } from '@/objects/user'
import { WebRouted, WebRoute } from '@/api/web-router'

export const Routes: Array<WebRoute> = [
  {
    controller: get,
    method: 'post',
    name: 'user-get',
    path: '/api/user',
    middleware: [Middleware.validateSession]
  }
]

export async function get(routed: WebRouted) {
  const v = await validate(Validation.User.get(), routed.req.body)

  if (v.valid) {
    const query = v.o._id !== undefined ? { _id: v.o._id } : { id: v.o.id }

    var user = await routed.Bot.DB.get<TrackedUser>('users', query, {
      avatar: 1,
      username: 1,
      discriminator: 1,
      ChastiKey: 1
    })

    return routed.res.send(user)
  }

  // On error
  return routed.next(new errors.BadRequestError())
}
