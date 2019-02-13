import * as Validation from '../validations/index';
import * as errors from 'restify-errors';
import { validate } from '../utils/validate';
import { WebRouted } from '../web-router';
import { TrackedNotification } from '../../objects/notification';
import { ObjectID } from 'bson';

export namespace Notifications {
  export async function getNotifications(routed: WebRouted) {
    const v = await validate(Validation.Notifications.get(), routed.req.body)

    if (v.valid) {

      // User & Token from header
      const id = routed.req.header('id')

      var notificationSettings = await routed.Bot.DB.getMultiple<TrackedNotification>('notifications', {
        authorID: id,
        serverID: v.o.serverID
      })

      return routed.res.send(notificationSettings);
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }

  export async function updateNotification(routed: WebRouted) {
    const v = await validate(Validation.Notifications.update(), routed.req.body)

    // User & Token from header
    const id = routed.req.header('id')

    // Ensure update is for user who's authenticated
    const isCorrectUser = id === v.o.authorID

    if (v.valid && isCorrectUser) {
      // Ensure owner is properly set to an ObjectID
      v.o.owner = new ObjectID(v.o.owner)
      var updateCount

      // Exists in db
      const storedVersion = await routed.Bot.DB.get<TrackedNotification>('notifications', {
        name: v.o.name,
        owner: v.o.owner,
        serverID: v.o.serverID
      })

      // Add if not existsing
      if (!storedVersion) {
        await routed.Bot.DB.add<TrackedNotification>('notifications', v.o)
        updateCount = 1
      }
      // Else update
      else {
        updateCount = await routed.Bot.DB.update<TrackedNotification>('notifications', {
          name: v.o.name,
          owner: v.o.owner,
          serverID: v.o.serverID
        }, v.o)
      }
      if (updateCount > 0) return routed.res.send({ status: 'updated', success: true });
      return routed.res.send({ status: 'failed', success: false });
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }
}