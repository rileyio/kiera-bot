import { AcceptedResponse, RoutedInteraction } from '@/router'
import { TrackedDecision } from '@/objects/decision'

/**
 * Create a new decision in the DB
 * @export
 * @param {RoutedInteraction} routed
 */
export async function newDecision(routed: RoutedInteraction): AcceptedResponse {
  const title = routed.interaction.options.get('title')?.value as string
  // Create a new question &
  const decision = new TrackedDecision({
    authorID: routed.author.id,
    name: title,
    serverID: routed.guild.id
  })
  const updated = await routed.bot.DB.add('decision', decision)

  if (updated) {
    return await routed.reply(routed.$render('Decision.Edit.NewQuestionAdded', { id: decision._id }), true)
  }
  // return false
}
