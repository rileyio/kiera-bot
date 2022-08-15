import { RoutedInteraction } from '@/router'
import { embed } from './user.embed'

/**
 * Lookup ChastiSafe User
 * @export
 * @param {RoutedInteraction} routed
 */
export async function lookupUser(routed: RoutedInteraction) {
  console.log('CS User Lookup..')
  const username = routed.interaction.options.get('username')?.value as string
  const user = routed.interaction.options.getUser('user')
  const userOrUsernameProvided = username !== undefined || user !== undefined
  console.log('userOrUsernameProvided', userOrUsernameProvided)
  console.log('user.id || username || routed.author.id', user ? user : undefined || username || routed.author.id)
  const resp = await routed.bot.Service.ChastiSafe.fetchProfile(user ? user.id : undefined || username || routed.author.id)

  console.log('resp', resp)

  try {
    if (resp) {
      await routed.reply({ embeds: [embed(resp, routed)] })
    } else return await routed.reply('ChastiSafe user not found', true)
  } catch (error) {
    console.log('Failed to build response', error)
  }

  return false
}
