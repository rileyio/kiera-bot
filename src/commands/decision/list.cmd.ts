import { RoutedInteraction } from '@/router'
import { embed } from '@/commands/decision/list.embed'

export async function list(routed: RoutedInteraction) {
  const authorID = routed.author.id
  const decisionsStored = await routed.bot.DB.getMultiple('decision', { authorID })

  if (!decisionsStored.length) {
    return await routed.reply('There Are No Decision Rollers to List.')
  }

  console.log('decisionsStored', decisionsStored)

  return routed.reply({ embeds: [embed(authorID, decisionsStored)] }, true)
}
