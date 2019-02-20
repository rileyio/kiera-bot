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
      const newDecisionOutcome = new TrackedDecisionOption({ text: v.o.text })

      var addOutcome = await routed.Bot.DB.update<TrackedDecision>(
        'decision',
        { _id: new ObjectID(v.o._id), authorID: id },
        { $push: { options: newDecisionOutcome } },
        { atomic: true })


      if (addOutcome > 0) return routed.res.send({
        status: 'added', success: true, return: newDecisionOutcome
      });
      return routed.res.send({ status: 'failed', success: false });
    }

    // On error
    return routed.next(new errors.BadRequestError());
  }
}