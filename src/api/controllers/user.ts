import * as Validation from '../validations/index';
import * as errors from 'restify-errors';
import { validate } from '../utils/validate';
import { TrackedUser } from '../../objects/user';
import { WebRouted } from '../web-router';

export namespace User {
  export async function get(routed: WebRouted) {
    const v = await validate(Validation.User.get(), routed.req.body)

    if (v.valid) {
      const query = v.o._id !== undefined
        ? { _id: v.o._id }
        : { id: v.o.id }

      var user = await routed.Bot.DB.get<TrackedUser>('users', query, {
        avatar: 1,
        username: 1,
        discriminator: 1,
        guilds: 1
      })

      // Sort guilds
      user.guilds.sort(g => {
        return (g.owner) ? -1 : 1
      })

      return routed.res.send(user);
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }

  export async function oauth(routed: WebRouted) {
    var updateType: 'added' | 'updated' | 'error'
    var uUser: TrackedUser
    var token: string
    // tslint:disable-next-line:no-console
    const v = await validate(Validation.User.oauth(), routed.req.body)
    // tslint:disable-next-line:no-console
    console.log('v =>', v)

    try {
      if (v.valid) {
        const storedUser = await routed.Bot.DB.get('users', { id: v.o.id })
        // Is user already stored?
        uUser = (storedUser) ? new TrackedUser(storedUser) : new TrackedUser(v.o)
        // Update with Oauth data
        uUser.oauth(v.o)
        // tslint:disable-next-line:no-console
        console.log('=> User', uUser)
        // Reduce servers down to just ones where kiera is present and the user is also
        uUser.reduceServers(await routed.Bot.DB.getMultiple('servers', {}))

        if (storedUser) {
          await routed.Bot.DB.update('users', { id: v.o.id }, uUser)
          updateType = 'updated'
        }
        else {
          await routed.Bot.DB.add('users', uUser)
          updateType = 'added'
        }
      }
    } catch (error) {
      updateType = 'error'
      // tslint:disable-next-line:no-console
      console.log('=> Oauth Error', error)
    }

    if (updateType === 'added' || updateType === 'updated') {
      return routed.res.send({
        status: updateType, success: true, webToken: uUser.webToken
      });
    }
    else {
      routed.res.send({ status: updateType, success: false, token: token })
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }
}