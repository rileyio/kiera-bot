import { WebRouted } from '../web-router';
import { TrackedNotification } from '../../objects/notification';
import { TrackedAvailableObject } from '../../objects/available-objects';

export namespace Available {
  export async function notifications(routed: WebRouted) {
    // this.DEBUG_WEBAPI('req params', v.o)

    var templateNotifications = await routed.Bot.DB.getMultiple<TrackedNotification>('available-server-notifications', {
      serverID: ''
    }, { _id: 0 })

    return routed.res.send(templateNotifications);
  }

  export async function settings(routed: WebRouted) {
    // this.DEBUG_WEBAPI('req params', v.o)

    var templateNotifications = await routed.Bot.DB.getMultiple<TrackedAvailableObject>('available-server-settings', {}, { _id: 0 })
    return routed.res.send(templateNotifications);
  }
}