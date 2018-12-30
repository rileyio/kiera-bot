import * as Validation from '../validations/index';
import { Request, Response, Next } from 'restify';
import * as errors from 'restify-errors';
import { ObjectID } from 'bson';
import { validate } from '../utils/validate';
import { Controller } from '.';
import { DeviceSession } from '../../objects/sessions';

export class SessionsAPI extends Controller {
  public async getAll(req: Request, res: Response, next: Next) {
    const v = await validate(Validation.Sessions.getAll(), req.body)

    this.DEBUG_WEBAPI('req params', v.o)

    if (v.valid) {
      const sessions = await this.Bot.Sessions.getMultiple({
        sid: new ObjectID(v.o.sid),
        uid: new ObjectID(v.o.uid)
      })
      return res.send(sessions);
    }

    // On error
    return next(new errors.BadRequestError());
  }

  public async get(req: Request, res: Response, next: Next) {
    const v = await validate(Validation.Sessions.get(), req.body)

    this.DEBUG_WEBAPI('req params', v.o)

    if (v.valid) {
      const session = await this.Bot.Sessions.get({
        _id: new ObjectID(v.o.id),
      })

      // If session does not exist, return error
      if (!session) return next(new errors.BadRequestError());

      // Init session to do some calculations
      const nsession = new DeviceSession(session)
      // Update the record
      nsession.update()
      // Update db record
      await this.Bot.Sessions.update({ _id: nsession._id }, nsession)

      return res.send(nsession.apiOutput());
    }

    // On error
    return next(new errors.BadRequestError());
  }
}