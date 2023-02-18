import * as Middleware from '@/middleware'

import { ExportRoutes, RoutedInteraction } from '@/router'

import { AcceptedResponse } from '@/objects/router/routed-interaction'
import { ObjectId } from 'bson'
import { TrackedDecision } from '@/objects/decision'
import { decisionLogLast5 } from '@/embedded/decision-log'

export const Routes = ExportRoutes({
  category: 'Fun',
  controller: fetchDecisionLog,
  description: 'Help.Decision.Log.Description',
  example: '{{prefix}}decision log id',
  middleware: [Middleware.isUserRegistered],
  name: 'decision-log',
  type: 'message',
  validate: '/decision:string/log:string/id=string'
})

export async function fetchDecisionLog(routed: RoutedInteraction): AcceptedResponse {
  const log: Array<TrackedDecision> = await routed.bot.DB.aggregate('decision', [
    { $match: { $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }], _id: / * new ObjectId(routed.v.o.id) * / } },
    { $project: { _id: { $toString: '$_id' }, name: 1, options: 1 } },
    {
      $lookup: {
        as: 'log',
        foreignField: 'decisionID',
        from: 'decision-log',
        localField: '_id'
      }
    },
    { $unwind: '$log' },
    { $sort: { 'log._id': -1 } },
    { $limit: 5 },
    {
      $group: { _id: '$_id', log: { $push: '$log' }, name: { $first: '$name' }, options: { $first: '$options' } }
    },
    { $project: { _id: 1, log: 1, name: 1, options: 1 } }
  ])

  if (!log) {
    // If nothing comes up, inform the user
    return await routed.reply('Could not find a decision roll from the ID provided.')
  }

  const decision = log[0]
  return await routed.reply({ embeds: [decisionLogLast5(decision, routed.author)] })
}
