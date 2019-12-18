import * as Validation from '@/api/validations'
import { WebRouted } from '@/api/web-router'
import { TrackedNotification } from '@/objects/notification'
import { TrackedAvailableObject } from '@/objects/available-objects'
import { TrackedUser } from '@/objects/user'
import { validate } from '@/api/utils/validate'

export namespace Available {
  export async function notifications(routed: WebRouted) {
    const v = await validate(Validation.Available.notifications(), routed.req.body)
    // this.DEBUG_WEBAPI('req params', v.o)

    // Requested server
    const serverID = v.o.serverID

    var templateNotifications = await routed.Bot.DB.getMultiple<TrackedNotification>(
      'available-server-notifications',
      {
        serverID: serverID.length > 0 ? serverID : ''
      },
      { _id: 0 }
    )

    return routed.res.send(templateNotifications)
  }

  export async function settings(routed: WebRouted) {
    // this.DEBUG_WEBAPI('req params', v.o)

    var templateNotifications = await routed.Bot.DB.getMultiple<TrackedAvailableObject>('available-server-settings', {}, { _id: 0 })
    return routed.res.send(templateNotifications)
  }

  export async function userGeneric(routed: WebRouted) {
    return routed.res.send(new TrackedUser({}))
  }
}
