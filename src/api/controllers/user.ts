import * as Validation from '../validations/index';
import * as errors from 'restify-errors';
import { validate } from '../utils/validate';
import { TrackedUser } from '../../objects/user';
import { WebRouted } from '../web-router';

export namespace User {
  export async function get(routed: WebRouted) {
    const v = await validate(Validation.User.get(), routed.req.body)

    // this.DEBUG_WEBAPI('req params', v.o)

    if (v.valid) {
      const query = v.o._id !== undefined
        ? { _id: v.o._id }
        : { id: v.o.id }

      var user = await routed.Bot.DB.get('users', query, { username: 1, discriminator: 1 })

      return routed.res.send(user);
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }

  export async function oauth(routed: WebRouted) {
    const v = await validate(Validation.User.get(), routed.req.body)

    // this.DEBUG_WEBAPI('req params', v.o)

    if (v.valid) {
      const storedUser = await routed.Bot.DB.get('users', { id: v.o.id })
      // Is user already stored?
      const uUser = storedUser ? new TrackedUser(storedUser) : new TrackedUser(v.o)
      var updateType: 'added' | 'updated' | 'error'

      try {
        if (storedUser) {
          await routed.Bot.DB.update('users', { id: v.o.id }, uUser)
          updateType = 'updated'
        }
        else {
          await routed.Bot.DB.add('users', uUser)
          updateType = 'added'
        }
      } catch (error) {
        updateType = 'error'
      }

      return routed.res.send({ status: updateType, success: updateType !== 'error' });
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }
}