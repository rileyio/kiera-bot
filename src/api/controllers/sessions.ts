import * as Validation from '../validations/index';
import { Request, Response, Next } from 'restify';
import * as errors from 'restify-errors';
import { ObjectID } from 'bson';
import { validate } from '../utils/validate';
import { DeviceSession } from '../../objects/sessions';
import { WebRouted } from '../web-router';

export namespace Sessions {
  export async function getAll(routed: WebRouted) {
    const v = await validate(Validation.Sessions.getAll(), routed.req.body)

    // this.DEBUG_WEBAPI('req params', v.o)

    if (v.valid) {
      const sessions = await routed.Bot.Sessions.getMultiple({
        sid: new ObjectID(v.o.sid),
        uid: new ObjectID(v.o.uid)
      })
      return routed.res.send(sessions);
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }

  export async function get(routed: WebRouted) {
    const v = await validate(Validation.Sessions.get(), routed.req.body)

    // this.DEBUG_WEBAPI('req params', v.o)

    if (v.valid) {
      const session = await routed.Bot.Sessions.get({
        _id: new ObjectID(v.o.id),
      })

      // If session does not exist, return error
      if (!session) return routed.next(new errors.BadRequestError());

      // Init session to do some calculations
      const nsession = new DeviceSession(session)
      // Update the record
      nsession.update()
      // Update db record
      await routed.Bot.Sessions.update({ _id: nsession._id }, nsession)

      return routed.res.send(nsession.apiOutput());
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }
}