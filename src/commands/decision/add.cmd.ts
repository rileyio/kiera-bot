import { AcceptedResponse, Routed } from '#router/index'
import { TrackedDecision, TrackedDecisionOption } from '#objects/decision'

import { ObjectId } from 'mongodb'

/**
 * Add decision option
 * @export
 * @param {Routed} routed
 */
export async function addOutcome(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const id = routed.interaction.options.get('id')?.value as string
  const outcome = routed.interaction.options.get('value')?.value as string
  const type = routed.interaction.options.get('type')?.value as 'string' | 'image' | 'url' | 'markdown'

  // Get the saved decision from the db (Only the creator can edit)
  const decisionFromDB = await routed.bot.DB.get('decision', {
    $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }],
    _id: new ObjectId(id)
  })

  if (decisionFromDB) {
    const decision = new TrackedDecision(decisionFromDB)
    decision.options.push(new TrackedDecisionOption({ text: outcome, type: type }))
    await routed.bot.DB.update('decision', { _id: decision._id }, decision)
    return await routed.reply(routed.$render('Decision.Edit.NewEntry', { added: outcome }), true)
  }

  return await routed.reply('Could not find a Decision Roller with that ID.', true)
}
