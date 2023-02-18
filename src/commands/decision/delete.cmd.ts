import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, MessageComponentInteraction, SelectMenuBuilder, SelectMenuInteraction, TextChannel } from 'discord.js'

import { AcceptedResponse } from '@/objects/router/routed-interaction'
import { ObjectID } from 'mongodb'
import { RoutedInteraction } from '@/router'

/**
 * Delete decision in the DB
 * @export
 * @param {RoutedInteraction} routed
 */
export async function deleteDecision(routed: RoutedInteraction): AcceptedResponse {
  const decisionsStored = await routed.bot.DB.getMultiple('decision', { authorID: routed.author.id })
  let selectedID = ''

  // Filter to watch for user reponse
  const filter = (i: MessageComponentInteraction) => i.user.id === routed.author.id

  // Confirmation Buttons
  const confirmation = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(new ButtonBuilder().setCustomId('yes').setLabel('Yes, Delete').setStyle(ButtonStyle.Danger))
    .addComponents(new ButtonBuilder().setCustomId('no').setLabel('Cancel Deletion').setStyle(ButtonStyle.Success))

  // Dropdown of user's decisions
  const dropdown = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
    new SelectMenuBuilder()
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
  const collector = (routed.interaction.channel as TextChannel).createMessageComponentCollector({ filter, time: 15000 })
  collector.on('collect', async (i: SelectMenuInteraction | ButtonInteraction) => {
    // When its not the author interacting, skip
    if (i.user.id !== routed.author.id) return

    // When the collected interaction is from the
    if (i.componentType === ComponentType.SelectMenu) {
      selectedID = i.values[0] as string
      await i.update({ components: [confirmation], content: `Are you sure you wish to delete this Decision Roll (\`${selectedID}\`)?`, embeds: [] })
    }

    if (i.componentType === ComponentType.Button && i.customId === 'yes') {
      const deleted = await routed.bot.DB.remove('decision', { _id: new ObjectID(selectedID) })
      if (deleted) {
        await i.update({ components: [], content: 'Decision Roll Deleted!', embeds: [] })
        collector.stop()
      }
    }

    if (i.componentType === ComponentType.Button && i.customId === 'no') {
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
