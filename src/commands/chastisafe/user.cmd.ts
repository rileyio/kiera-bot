import { AcceptedResponse, Routed } from '@/router'
import { embed } from './user.embed'

/**
 * Lookup ChastiSafe User
 * @export
 * @param {Routed} routed
 */
export async function lookupUser(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const username = routed.interaction.options.get('username')?.value as string
  const user = routed.interaction.options.getUser('user')
  const resp = await routed.bot.Service.ChastiSafe.fetchProfile(user ? user.id : undefined || username || routed.author.id)

  // If there's an error, inform the user
  if (resp.successful === false) return await routed.reply({ content: 'ChastiSafe user not found', ephemeral: true })

  try {
    return await routed.reply({ embeds: [embed(resp.data, routed)] })
  } catch (error) {
    console.log('Failed to build response', error)
  }
}
