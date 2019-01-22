import * as Validation from '../validations/index';
import * as errors from 'restify-errors';
import { ObjectID } from 'bson';
import { validate } from '../utils/validate';
import { WebRouted } from '../web-router';

export namespace Permissions {
  export async function getAll(routed: WebRouted) {
    const v = { o: {}, valid: true }
    // await validate(Validation.Permissions.getAll(), req.body)

    // this.DEBUG_WEBAPI('req params', v.o)

    // if (v.valid) {
    //   const permissions = await routed.Bot.Permissions.getMultiple({})
    //   return routed.res.send(permissions);
    // }

    // On error
    return routed.next(new errors.BadRequestError());
  }

  export async function get(routed: WebRouted) {
    const v = await validate(Validation.Permissions.get(), routed.req.body)

    // this.DEBUG_WEBAPI('req params', v.o)

    // if (v.valid) {
    //   var permission = await routed.Bot.Permissions.get({
    //     _id: new ObjectID(v.o.id),
    //   })

    //   // If session does not exist, return error
    //   if (!permission) return routed.next(new errors.BadRequestError());
    //   return routed.res.send(permission);
    // }

    // On error
    return routed.next(new errors.BadRequestError());
  }
}