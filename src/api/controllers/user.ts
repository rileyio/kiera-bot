import * as Validation from '../validations/index';
import * as errors from 'restify-errors';
import { validate } from '../utils/validate';
import { TrackedUser } from '../../objects/user';
import { WebRouted } from '../web-router';
import { ObjectID } from 'bson';
import { performance } from 'perf_hooks';

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
        guilds: 1,
        ChastiKey: 1
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

  export async function update(routed: WebRouted) {
    const v = await validate(Validation.User.update(), routed.req.body)

    if (v.valid) {
      var updateValueKey;

      switch (v.o.key) {
        case 'ChastiKey.username':
          updateValueKey = { $set: { 'ChastiKey.username': v.o.value } }
          break;
        case 'ChastiKey.ticker.type':
          updateValueKey = { $set: { 'ChastiKey.ticker.type': v.o.value } }
          break;
        case 'ChastiKey.ticker.date':
          updateValueKey = { $set: { 'ChastiKey.ticker.date': v.o.value } }
          break;
        case 'ChastiKey.ticker.showStarRatingScore':
          updateValueKey = { $set: { 'ChastiKey.ticker.showStarRatingScore': v.o.value } }
          break;
        default:
          // On error
          return routed.next(new errors.BadRequestError());
      }

      var user = await routed.Bot.DB.update<TrackedUser>('users',
        { id: routed.req.header('id') }, updateValueKey, { atomic: true })

      return routed.res.send({ status: 'updated', success: true });
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }

  export async function oauth(routed: WebRouted) {
    const runtimeStart = performance.now()
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
      var auditDetails = ''

      switch (updateType) {
        case 'added':
          auditDetails = 'Logging in to kiera-web'
          break;
        case 'updated':
          auditDetails = 'Logging in to kiera-web (Refreshed login)'
          break;

        default:
          auditDetails = 'THIS SHOULD NEVER HAPPEN!'
          break;
      }

      // Track in an audit event
      routed.Bot.Audit.NewEntry({
        name: 'API Authentication',
        details: auditDetails,
        runtime: Math.round(performance.now() - runtimeStart),
        owner: v.o.id,
        successful: true,
        type: 'api.oauth',
        where: 'API'
      })

      return routed.res.send({
        status: updateType, success: true, webToken: uUser.webToken
      });
    }
    else {
      // Track in an audit event
      routed.Bot.Audit.NewEntry({
        name: 'API Authentication Failed',
        details: '',
        runtime: Math.round(performance.now() - runtimeStart),
        owner: v.o.id,
        successful: false,
        type: 'api.oauth',
        where: 'API'
      })

      routed.res.send({ status: updateType, success: false, token: token })
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }
}