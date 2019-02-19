import * as Validation from '../validations/index';
import * as errors from 'restify-errors';
import { validate } from '../utils/validate';
import { WebRouted } from '../web-router';
import { TrackedDecision, TrackedDecisionOption } from '../../objects/decision';
import { ObjectID } from 'bson';

export namespace Decisions {
  export async function getDecisions(routed: WebRouted) {
    const v = await validate(Validation.Decisions.get(), routed.req.body)

    if (v.valid) {

      // User & Token from header
      const id = routed.req.header('id')

      var decisions = await routed.Bot.DB.getMultiple<TrackedDecision>('decision', {
        authorID: id,
        serverLimited: v.o.serverLimited
      })

      return routed.res.send(decisions);
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }

  export async function toggleEnabled(routed: WebRouted) {
    const v = await validate(Validation.Decisions.update(), routed.req.body)

  }

  export async function deleteOne(routed: WebRouted) {
    const v = await validate(Validation.Decisions.deleteOne(), routed.req.body)

    if (v.valid) {
      // User & Token from header
      const id = routed.req.header('id')

      var deleteCount = await routed.Bot.DB.remove<TrackedDecision>('decision', {
        _id: new ObjectID(v.o._id),
        authorID: id
      })

      if (deleteCount > 0) return routed.res.send({ status: 'deleted', success: true });
      return routed.res.send({ status: 'failed', success: false });
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }

  export async function decisionOutcomeUpdate(routed: WebRouted) {
    const v = await validate(Validation.Decisions.update(), routed.req.body)

    if (v.valid) {
      // User & Token from header
      const id = routed.req.header('id')

      const updateCount = await routed.Bot.DB.update(
        'decision',
        { authorID: id, 'options._id': new ObjectID(v.o._id) },
        {
          $set: {
            'options.$.text': v.o.text
          }
        }, { atomic: true })

      if (updateCount > 0) return routed.res.send({ status: 'updated', success: true });
      return routed.res.send({ status: 'failed', success: false });
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }


  export async function deleteDecisionOutcome(routed: WebRouted) {
    const v = await validate(Validation.Decisions.deleteOutcome(), routed.req.body)

    if (v.valid) {
      // User & Token from header
      const id = routed.req.header('id')

      var deleteCount = await routed.Bot.DB.update<TrackedDecision>(
        'decision',
        (<any>{ authorID: id, 'options._id': new ObjectID(v.o._id) }),
        { $pull: { options: { _id: new ObjectID(v.o._id) } } },
        { atomic: true })

      if (deleteCount > 0) return routed.res.send({ status: 'deleted', success: true });
      return routed.res.send({ status: 'failed', success: false });
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }

  export async function addDecisionOutcome(routed: WebRouted) {
    const v = await validate(Validation.Decisions.addOutcome(), routed.req.body)

    if (v.valid) {
      // User & Token from header
      const id = routed.req.header('id')

      var deleteCount = await routed.Bot.DB.update<TrackedDecision>(
        'decision',
        { _id: new ObjectID(v.o._id), authorID: id },
        { $push: { options: new TrackedDecisionOption({ text: v.o.text }) } },
        { atomic: true })


      if (deleteCount > 0) return routed.res.send({ status: 'deleted', success: true });
      return routed.res.send({ status: 'failed', success: false });
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }


  // export async function updateNotification(routed: WebRouted) {
  //   const v = await validate(Validation.Notifications.update(), routed.req.body)

  //   // User & Token from header
  //   const id = routed.req.header('id')

  //   // Ensure update is for user who's authenticated
  //   const isCorrectUser = id === v.o.authorID

  //   if (v.valid && isCorrectUser) {
  //     // Ensure owner is properly set to an ObjectID
  //     v.o.owner = new ObjectID(v.o.owner)
  //     var updateCount

  //     // Exists in db
  //     const storedVersion = await routed.Bot.DB.get<TrackedNotification>('notifications', {
  //       name: v.o.name,
  //       owner: v.o.owner,
  //       serverID: v.o.serverID
  //     })

  //     // Add if not existsing
  //     if (!storedVersion) {
  //       await routed.Bot.DB.add<TrackedNotification>('notifications', v.o)
  //       updateCount = 1
  //     }
  //     // Else update
  //     else {
  //       updateCount = await routed.Bot.DB.update<TrackedNotification>('notifications', {
  //         name: v.o.name,
  //         owner: v.o.owner,
  //         serverID: v.o.serverID
  //       }, v.o)
  //     }
  //     if (updateCount > 0) return routed.res.send({ status: 'updated', success: true });
  //     return routed.res.send({ status: 'failed', success: false });
  //   }

  //   // On error
  //   return routed.next(new errors.BadRequestError());
  // }
}