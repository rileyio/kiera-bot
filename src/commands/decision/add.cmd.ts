import { TrackedDecision, TrackedDecisionOption } from '@/objects/decision'

import { ObjectID } from 'mongodb'
import { RoutedInteraction } from '@/router'

/**
 * Add decision option
 * @export
 * @param {RouterRouted} routed
 */
export async function addOutcome(routed: RoutedInteraction) {
  const id = routed.interaction.options.get('id')?.value as string
  const outcome = routed.interaction.options.get('value')?.value as string

  // Get the saved decision from the db (Only the creator can edit)
  const decisionFromDB = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectID(id)
  })

  if (decisionFromDB) {
    const decision = new TrackedDecision(decisionFromDB)
    decision.options.push(new TrackedDecisionOption({ text: outcome }))
    await routed.bot.DB.update('decision', { _id: decision._id }, decision)
    return await routed.reply(routed.$render('Decision.Edit.NewEntry', { added: outcome }), true)
  }

  return await routed.reply('Could not find a Decision Roller with that ID.', true)
}
