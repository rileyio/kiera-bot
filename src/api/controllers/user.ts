import * as jwt from 'jsonwebtoken'
import * as Validation from '@/api/validations'
import * as errors from 'restify-errors'
import { validate } from '@/api/utils/validate'
import { TrackedUser } from '@/objects/user'
import { WebRouted } from '@/api/web-router'

export namespace User {
  export async function get(routed: WebRouted) {
    const v = await validate(Validation.User.get(), routed.req.body)

    if (v.valid) {
      const query = v.o._id !== undefined ? { _id: v.o._id } : { id: v.o.id }

      var user = await routed.Bot.DB.get<TrackedUser>('users', query, {
        avatar: 1,
        username: 1,
        discriminator: 1,
        guilds: 1,
        ChastiKey: 1
      })

      // Sort guilds
      user.guilds.sort(g => {
        return g.owner ? -1 : 1
      })

      return routed.res.send(user)
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }

  export async function update(routed: WebRouted) {
    const v = await validate(Validation.User.update(), routed.req.body)

    if (v.valid) {
      var updateValueKey

      switch (v.o.key) {
        case 'ChastiKey.username':
          updateValueKey = { $set: { 'ChastiKey.username': v.o.value } }
          break
        case 'ChastiKey.ticker.type':
          updateValueKey = { $set: { 'ChastiKey.ticker.type': v.o.value } }
          break
        case 'ChastiKey.ticker.date':
          updateValueKey = { $set: { 'ChastiKey.ticker.date': v.o.value } }
          break
        case 'ChastiKey.ticker.showStarRatingScore':
          updateValueKey = { $set: { 'ChastiKey.ticker.showStarRatingScore': v.o.value } }
          break
        default:
          // On error
          return routed.next(new errors.BadRequestError())
      }

      await routed.Bot.DB.update<TrackedUser>('users', { id: routed.req.header('id') }, updateValueKey, { atomic: true })

      return routed.res.send({ status: 'updated', success: true })
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }
}
