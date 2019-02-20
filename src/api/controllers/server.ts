import * as Validation from '../validations/index';
import * as errors from 'restify-errors';
import { validate } from '../utils/validate';
import { WebRouted } from '../web-router';
import { TrackedAvailableObject } from '../../objects/available-objects';

export namespace Server {
  export async function settings(routed: WebRouted) {
    const v = await validate(Validation.Server.getSettings(), routed.req.body)

    // this.DEBUG_WEBAPI('req params', v.o)

    if (v.valid) {
      var serverSettings = await routed.Bot.DB.getMultiple<TrackedAvailableObject>('server-settings', {
        serverID: ''
      }, { _id: 0 })

      return routed.res.send(serverSettings);
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }
}