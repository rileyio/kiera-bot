import * as Middleware from '@/middleware'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedDecision } from '@/objects/decision'
import { ObjectID } from 'bson'
import { decisionLogLast5 } from '@/embedded/decision-log'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Fun',
  controller: fetchDecisionLog,
  description: 'Help.Decision.Log.Description',
  example: '{{prefix}}decision log id',
  name: 'decision-log',
  validate: '/decision:string/log:string/id=string',
  middleware: [Middleware.isUserRegistered]
})

export async function fetchDecisionLog(routed: RouterRouted) {
  const log: Array<TrackedDecision> = await routed.bot.DB.aggregate('decision', [
    { $match: { _id: new ObjectID(routed.v.o.id), authorID: routed.user.id } },
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
    { $limit: 5 },
    {
      $group: { _id: '$_id', name: { $first: '$name' }, options: { $first: '$options' }, log: { $push: '$log' } }
    },
    { $project: { _id: 1, name: 1, options: 1, log: 1 } }
  ])

  if (!log) {
    // If nothing comes up, inform the user
    await routed.message.reply('Could not find a decision roll from the ID provided.')
    return true // Stop Here
  }

  const decision = log[0]
  await routed.message.channel.send(decisionLogLast5(decision, routed.author))

  return true
}
