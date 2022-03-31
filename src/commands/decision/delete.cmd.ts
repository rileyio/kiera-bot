import { ButtonInteraction, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed, MessageSelectMenu, SelectMenuInteraction } from 'discord.js'

import { ObjectID } from 'mongodb'
import { RoutedInteraction } from '@/router'

/**
 * Delete decision in the DB
 * @export
 * @param {RouterRouted} routed
 */
export async function deleteDecision(routed: RoutedInteraction) {
  const decisionsStored = await routed.bot.DB.getMultiple('decision', { authorID: routed.author.id })
  let selectedID = ''

  // Filter to watch for user reponse
  const filter = (i: MessageComponentInteraction) => i.user.id === routed.author.id

  // Confirmation Buttons
  const confirmation = new MessageActionRow()
    .addComponents(new MessageButton().setCustomId('yes').setLabel('Yes, Delete').setStyle('DANGER'))
    .addComponents(new MessageButton().setCustomId('no').setLabel('Cancel Deletion').setStyle('SUCCESS'))

  // Dropdown of user's decisions
  const dropdown = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId('select')
      .setPlaceholder('Select Decision Roll to Delete')
      .addOptions([
        ...decisionsStored.map((d) => {
          return {
            description: d._id.toHexString(),
            label: d.name,
            value: d._id.toHexString()
          }
        })
      ])
  )

  // Collector to recieve interaction (With 15s timeout)
  const collector = routed.interaction.channel.createMessageComponentCollector({ filter, time: 15000 })
  collector.on('collect', async (i: SelectMenuInteraction | ButtonInteraction) => {
    // When its not the author interacting, skip
    if (i.user.id !== routed.author.id) return

    // When the collected interaction is from the
    if (i.componentType === 'SELECT_MENU') {
      selectedID = i.values[0] as string
      await i.update({ components: [confirmation], content: `Are you sure you wish to delete this Decision Roll (\`${selectedID}\`)?`, embeds: [] })
    }

    if (i.componentType === 'BUTTON' && i.customId === 'yes') {
      const deleted = await routed.bot.DB.remove('decision', { _id: new ObjectID(selectedID) })
      if (deleted) {
        await i.update({ components: [], content: 'Decision Roll Deleted!', embeds: [] })
        collector.stop()
      }
    }

    if (i.componentType === 'BUTTON' && i.customId === 'no') {
      await i.update({ components: [], content: 'Cancelled Decision Roll Deletion.', embeds: [] })
      collector.stop()
    }
  })

  // Send message w/dropdown to determine which Decision to
  if (decisionsStored.length) {
    await routed.reply(
      {
        components: [dropdown]
      },
      true
    )
  }

  // Nothing to delete - notify caller
  return await routed.reply('Could not find a Decision Roller with that ID.', true)
}
