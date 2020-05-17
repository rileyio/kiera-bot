import * as errors from 'restify-errors'
import * as Middleware from '@/api/middleware'
import * as Validation from '@/api/validations'
import { validate } from '@/api/utils/validate'
import { WebRouted, WebRoute } from '@/api/web-router'
import { TrackedDecision, TrackedDecisionOption, TrackedDecisionLogEntry } from '@/objects/decision'
import { ObjectID } from 'bson'
import { TextChannel, Guild, Channel, User } from 'discord.js'

export const Routes: Array<WebRoute> = [
  {
    controller: getDecision,
    method: 'post',
    name: 'web-decision-as-owner',
    path: '/api/decision',
    middleware: [Middleware.validateSession]
  },
  {
    controller: getDecisions,
    method: 'get',
    name: 'web-decisions-as-owner',
    path: '/api/decisions',
    middleware: [Middleware.validateSession]
  },
  {
    controller: updateDecision,
    method: 'patch',
    name: 'web-decision-update-props',
    path: '/api/decision/props',
    middleware: [Middleware.validateSession]
  },
  {
    controller: addDecisionOutcome,
    method: 'put',
    name: 'web-decision-new-outcome',
    path: '/api/decision/outcome',
    middleware: [Middleware.validateSession]
  },
  {
    controller: updateDecisionOutcome,
    method: 'patch',
    name: 'web-decision-update-outcome',
    path: '/api/decision/outcome',
    middleware: [Middleware.validateSession]
  },
  {
    controller: deleteDecisionOutcome,
    method: 'delete',
    name: 'web-decision-new-outcome',
    path: '/api/decision/outcome',
    middleware: [Middleware.validateSession]
  },
  {
    controller: addDecision,
    method: 'put',
    name: 'web-decision-new',
    path: '/api/decision',
    middleware: [Middleware.validateSession]
  },
  {
    controller: deleteDecision,
    method: 'delete',
    name: 'web-decision-delete',
    path: '/api/decision',
    middleware: [Middleware.validateSession]
  },
  {
    controller: resetConsumed,
    method: 'patch',
    name: 'web-decision-reset-consume-mode',
    path: '/api/decision/consumedReset',
    middleware: [Middleware.validateSession]
  }
]

export async function getDecision(routed: WebRouted) {
  const v = await validate(Validation.Decisions.getDecision(), routed.req.body)
  if (v.valid) {
    const decision = await routed.Bot.DB.get<TrackedDecision>('decision', {
      _id: new ObjectID(v.o._id),
      authorID: routed.session.userID
    })

    if (decision) {
      try {
        const logLookup: Array<TrackedDecision> = await routed.Bot.DB.aggregate('decision', [
          { $match: { _id: new ObjectID(v.o._id), authorID: routed.session.userID } },
          { $project: { _id: { $toString: '$_id' }, name: 1, options: 1 } },
          {
            $lookup: {
              from: 'decision-log',
              localField: '_id',
              foreignField: 'decisionID',
              as: 'log'
            }
          },
          { $unwind: '$log' },
          { $sort: { 'log._id': -1 } },
          { $limit: 20 },
          {
            $group: { _id: '$_id', name: { $first: '$name' }, options: { $first: '$options' }, log: { $push: '$log' } }
          },
          { $project: { _id: 1, name: 1, options: 1, log: 1 } }
        ])

        // Add to decision
        decision.log = logLookup[0].log

        // Map Names
        decision.log = decision.log.map(d => {
          d._id = new Date(parseInt(String(d._id).substring(0, 8), 16) * 1000).toUTCString()
          var guild = null as Guild
          var channel = null as Channel
          var caller = null as User

          try {
            guild = routed.Bot.client.guilds.cache.get(d.serverID)
            // channel = routed.Bot.client.channels.find(c => c.id !== d.channelID)
            caller = routed.Bot.client.users.cache.find(u => u.id === d.callerID)

            d.serverID = guild.name
            // d.channelID = channel.
            d.callerID = `${caller.username}#${caller.discriminator}`
          } catch (error) {}

          return d
        })
      } catch (error) {
        console.log('No decision log to lookup or add')
      }

      // Lookup usage count to append
      const used = await routed.Bot.DB.count<TrackedDecisionLogEntry>('decision-log', { decisionID: decision._id.toHexString() })
      decision.counter = used

      return routed.res.send({ status: 'fetchedOne', success: true, data: new TrackedDecision(decision) })
    }
    return routed.res.send({ status: 'failed', success: false })
  }

  return routed.next(new errors.BadRequestError())
}

export async function getDecisions(routed: WebRouted) {
  const decisions = await routed.Bot.DB.getMultiple<TrackedDecision>('decision', {
    authorID: routed.session.userID
  })

  if (decisions.length) {
    return routed.res.send(decisions.map(d => new TrackedDecision(d)))
  }

  return routed.next(new errors.BadRequestError())
}

export async function deleteDecision(routed: WebRouted) {
  const v = await validate(Validation.Decisions.deleteDecision(), routed.req.body)

  if (v.valid) {
    var deleteCount = await routed.Bot.DB.remove<TrackedDecision>('decision', {
      _id: new ObjectID(v.o._id),
      authorID: routed.session.userID
    })

    if (deleteCount > 0) return routed.res.send({ status: 'deleted', success: true })
    return routed.res.send({ status: 'failed', success: false })
  }

  // On error
  return routed.next(new errors.BadRequestError())
}

export async function updateDecisionOutcome(routed: WebRouted) {
  const v = await validate(Validation.Decisions.updateDecisionOutcome(), routed.req.body)

  if (v.valid) {
    const updateCount = await routed.Bot.DB.update(
      'decision',
      { authorID: routed.session.userID, 'options._id': new ObjectID(v.o._id) },
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

export async function updateDecision(routed: WebRouted) {
  const v = await validate(Validation.Decisions.updateProps(), routed.req.body)

  if (v.valid) {
    const updateCount = await routed.Bot.DB.update(
      'decision',
      { authorID: routed.session.userID, _id: new ObjectID(v.o._id) },
      {
        $set: {
          name: v.o.name,
          description: v.o.description || '',
          enabled: v.o.enabled,
          serverWhitelist: v.o.serverWhitelist || '',
          userWhitelist: v.o.userWhitelist || '',
          userBlacklist: v.o.userBlacklist || '',
          consumeMode: v.o.consumeMode,
          consumeReset: v.o.consumeReset
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

export async function updateDecisionConsumeReset(routed: WebRouted) {
  const v = await validate(Validation.Decisions.updateConsumeReset(), routed.req.body)

  if (v.valid) {
    const updateCount = await routed.Bot.DB.update('decision', { _id: new ObjectID(v.o._id) }, { $set: { consumeReset: Number(v.o.consumeReset) } }, { atomic: true })

    if (updateCount > 0) return routed.res.send({ status: 'updated', success: true })
    return routed.res.send({ status: 'failed', success: false })
  }

  // On error
  return routed.next(new errors.BadRequestError())
}

export async function deleteDecisionOutcome(routed: WebRouted) {
  const v = await validate(Validation.Decisions.deleteOutcome(), routed.req.body)

  if (v.valid) {
    var deleteCount = await routed.Bot.DB.update<TrackedDecision>(
      'decision',
      <any>{ authorID: routed.session.userID, 'options._id': new ObjectID(v.o._id) },
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

  if (v.valid) {
    const newDecisionOutcome = new TrackedDecisionOption({ text: v.o.text, type: v.o.type })

    const addOutcome = await routed.Bot.DB.update<TrackedDecision>(
      'decision',
      { _id: new ObjectID(v.o._id), authorID: routed.session.userID },
      { $push: { options: newDecisionOutcome } },
      { atomic: true }
    )

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

  if (v.valid) {
    const newDeicison = new TrackedDecision({ name: v.o.name, authorID: routed.session.userID, serverID: '473856867768991744' })

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

export async function resetConsumed(routed: WebRouted) {
  const v = await validate(Validation.Decisions.resetConsumed(), routed.req.body)

  if (v.valid) {
    // Reset all options consumed properties
    const updateCount = await routed.Bot.DB.update(
      'decision',
      { _id: new ObjectID(v.o._id), 'options.consumed': true },
      { $set: { 'options.$[].consumed': false, 'options.$[].consumedTime': 0 } },
      { atomic: true }
    )

    if (updateCount > 0) return routed.res.send({ status: 'updated', success: true })
    return routed.res.send({ status: 'failed', success: false })
  }

  // On error
  return routed.next(new errors.BadRequestError())
}
