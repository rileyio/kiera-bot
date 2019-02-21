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
        serverID: v.o.serverID
      }, { _id: 0 })

      return routed.res.send(serverSettings);
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }

  export async function updateSettings(routed: WebRouted) {
    const v = await validate(Validation.Server.updateSetting(), routed.req.body)

    // console.log('req params', v)

    if (v.valid) {
      var updateCount = await routed.Bot.DB.update<TrackedAvailableObject>('server-settings',
        { serverID: v.o.serverID },
        {
          $set: {
            state: v.o.state,
            value: v.o.value
          }
        }, { atomic: true })

      if (updateCount > 0) return routed.res.send({ status: 'updated', success: true });
      return routed.res.send({ status: 'failed', success: false });
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }
}