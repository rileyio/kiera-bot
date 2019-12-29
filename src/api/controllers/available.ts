import * as Validation from '@/api/validations'
import { WebRouted } from '@/api/web-router'
import { TrackedAvailableObject } from '@/objects/available-objects'
import { TrackedUser } from '@/objects/user'
import { validate } from '@/api/utils/validate'

export namespace Available {
  export async function settings(routed: WebRouted) {
    // this.DEBUG_WEBAPI('req params', v.o)

    var templateNotifications = await routed.Bot.DB.getMultiple<TrackedAvailableObject>('available-server-settings', {}, { _id: 0 })
    return routed.res.send(templateNotifications)
  }

  export async function userGeneric(routed: WebRouted) {
    return routed.res.send(new TrackedUser({}))
  }
}
