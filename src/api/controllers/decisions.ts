import * as Validation from '@/api/validations'
import * as errors from 'restify-errors'
import { validate } from '@/api/utils/validate'
import { WebRouted } from '@/api/web-router'
import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'
import { ObjectID } from 'bson'
import { TrackedUser } from '@/objects/user'

export namespace Decisions {
  export async function getDecisions(routed: WebRouted) {
    const session = routed.req.header('session')

    // Get user from users collection
    const user = new TrackedUser(await routed.Bot.DB.get<TrackedUser>('users', { 'ChastiKey.extSession': session }))

    // If user does not exist, fail
    if (!user) {
      return routed.next(new errors.BadRequestError())
    }

    const decisions = await routed.Bot.DB.getMultiple<TrackedDecision>('decision', {
      authorID: user.id
    })

    return routed.res.send(decisions.map(d => new TrackedDecision(d)))
  }

  export async function deleteDecision(routed: WebRouted) {
    const session = routed.req.header('session')
    const v = await validate(Validation.Decisions.deleteDecision(), routed.req.body)

    if (v.valid) {
      // Get user from users collection
      const user = new TrackedUser(await routed.Bot.DB.get<TrackedUser>('users', { 'ChastiKey.extSession': session }))

      var deleteCount = await routed.Bot.DB.remove<TrackedDecision>('decision', {
        _id: new ObjectID(v.o._id),
        authorID: user.id
      })

      if (deleteCount > 0) return routed.res.send({ status: 'deleted', success: true })
      return routed.res.send({ status: 'failed', success: false })
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }

  export async function updateDecisionOutcome(routed: WebRouted) {
    const session = routed.req.header('session')
    const v = await validate(Validation.Decisions.update(), routed.req.body)

    if (v.valid) {
      // Get user from users collection
      const user = new TrackedUser(await routed.Bot.DB.get<TrackedUser>('users', { 'ChastiKey.extSession': session }))

      const updateCount = await routed.Bot.DB.update(
        'decision',
        { authorID: user.id, 'options._id': new ObjectID(v.o._id) },
        {
          $set: {
            'options.$.text': v.o.text,
            'options.$.type': v.o.type
          }
        },
        { atomic: true }
      )

      if (updateCount > 0) return routed.res.send({ status: 'updated', success: true })
      return routed.res.send({ status: 'failed', success: false })
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }

  export async function updateDecisionName(routed: WebRouted) {
    const session = routed.req.header('session')
    const v = await validate(Validation.Decisions.updateOutcomeName(), routed.req.body)

    if (v.valid) {
      // Get user from users collection
      const user = new TrackedUser(await routed.Bot.DB.get<TrackedUser>('users', { 'ChastiKey.extSession': session }))

      const updateCount = await routed.Bot.DB.update(
        'decision',
        { authorID: user.id, _id: new ObjectID(v.o._id) },
        {
          $set: {
            name: v.o.name
          }
        },
        { atomic: true }
      )

      if (updateCount > 0) return routed.res.send({ status: 'updated', success: true })
      return routed.res.send({ status: 'failed', success: false })
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }

  export async function deleteDecisionOutcome(routed: WebRouted) {
    const v = await validate(Validation.Decisions.deleteOutcome(), routed.req.body)
    const session = routed.req.header('session')

    if (v.valid) {
      // Get user from users collection
      const user = new TrackedUser(await routed.Bot.DB.get<TrackedUser>('users', { 'ChastiKey.extSession': session }))

      var deleteCount = await routed.Bot.DB.update<TrackedDecision>(
        'decision',
        <any>{ authorID: user.id, 'options._id': new ObjectID(v.o._id) },
        { $pull: { options: { _id: new ObjectID(v.o._id) } } },
        { atomic: true }
      )

      if (deleteCount > 0) return routed.res.send({ status: 'deleted', success: true })
      return routed.res.send({ status: 'failed', success: false })
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }

  export async function addDecisionOutcome(routed: WebRouted) {
    const v = await validate(Validation.Decisions.addOutcome(), routed.req.body)
    const session = routed.req.header('session')

    if (v.valid) {
      // Get user from users collection
      const user = new TrackedUser(await routed.Bot.DB.get<TrackedUser>('users', { 'ChastiKey.extSession': session }))
      const newDecisionOutcome = new TrackedDecisionOption({ text: v.o.text, type: v.o.type })

      const addOutcome = await routed.Bot.DB.update<TrackedDecision>('decision', { _id: new ObjectID(v.o._id), authorID: user.id }, { $push: { options: newDecisionOutcome } }, { atomic: true })

      if (addOutcome > 0)
        return routed.res.send({
          status: 'added',
          success: true,
          data: newDecisionOutcome
        })
      return routed.res.send({ status: 'failed', success: false })
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }

  export async function addDecision(routed: WebRouted) {
    const v = await validate(Validation.Decisions.addDecision(), routed.req.body)
    const session = routed.req.header('session')

    if (v.valid) {
      // Get user from users collection
      const user = new TrackedUser(await routed.Bot.DB.get<TrackedUser>('users', { 'ChastiKey.extSession': session }))
      const newDeicison = new TrackedDecision({ name: v.o.name, authorID: user.id, serverID: '473856867768991744' })

      const decisionId = await routed.Bot.DB.add<TrackedDecision>('decision', newDeicison)

      if (decisionId) {
        return routed.res.send({
          status: 'added',
          success: true,
          id: decisionId
        })
      }

      return routed.res.send({ status: 'failed', success: false })
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }

  export async function enableDecision(routed: WebRouted) {
    const v = await validate(Validation.Decisions.enableDecision(), routed.req.body)
    const session = routed.req.header('session')

    if (v.valid) {
      // Get user from users collection
      const user = new TrackedUser(await routed.Bot.DB.get<TrackedUser>('users', { 'ChastiKey.extSession': session }))

      const updateCount = await routed.Bot.DB.update(
        'decision',
        { authorID: user.id, _id: new ObjectID(v.o._id) },
        {
          $set: {
            enabled: v.o.enabled
          }
        },
        { atomic: true }
      )

      if (updateCount > 0) return routed.res.send({ status: 'updated', success: true })
      return routed.res.send({ status: 'failed', success: false })
    }

    // On error
    return routed.next(new errors.BadRequestError())
  }
}
