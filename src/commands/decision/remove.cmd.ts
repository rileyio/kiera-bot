import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, MessageComponentInteraction, SelectMenuBuilder, SelectMenuInteraction } from 'discord.js'

import { ObjectID } from 'mongodb'
import { RoutedInteraction } from '@/router'
import { TrackedDecision } from '@/objects/decision'

/**
 * Delete outcome from Decision Roller
 * @export
 * @param {RoutedInteraction} routed
 */
export async function removeOutcome(routed: RoutedInteraction) {
  const decisionsStored = await routed.bot.DB.getMultiple('decision', { authorID: routed.author.id })
  const selectedOutcomeIDs: Array<string> = []
  let selectedDecisionRoll: TrackedDecision
  let decisionOutcomeDropdown: ActionRowBuilder<SelectMenuBuilder>

  // Filter to watch for user reponse
  const filter = (i: MessageComponentInteraction) => i.user.id === routed.author.id

  // Confirmation Buttons
  const confirmation = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(new ButtonBuilder().setCustomId('yes').setLabel('Yes, Remove').setStyle(ButtonStyle.Danger))
    .addComponents(new ButtonBuilder().setCustomId('no').setLabel('Cancel Removal').setStyle(ButtonStyle.Success))

  // Dropdown of user's decisions
  const decisionsDropdown = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
    new SelectMenuBuilder()
      .setCustomId('decisions')
      .setPlaceholder('Select Decision to Remove Outcome from')
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
  const collector = routed.interaction.channel.createMessageComponentCollector({ filter, time: 60000 })
  collector.on('collect', async (i: SelectMenuInteraction | ButtonInteraction) => {
    console.log('🌟 Interaction Type:', i.componentType, ', customId:', i.customId)
    // When its not the author interacting, skip
    if (i.user.id !== routed.author.id) return

    // When the collected interaction is from the Decisions list
    if (i.componentType === ComponentType.SelectMenu && i.customId === 'decisions') {
      selectedDecisionRoll = decisionsStored.find((d) => d._id.toHexString() === (i.values[0] as string))
      // Disable Decision Selector
      decisionsDropdown.components[0].setDisabled(true)

      // Generate Outcomes dropdown
      decisionOutcomeDropdown = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId('outcomes')
          .setPlaceholder('Select Outcomes to Remove')
          .addOptions([
            ...selectedDecisionRoll.options.map((o) => {
              return {
                description: o._id.toHexString(),
                label: o.text,
                value: o._id.toHexString()
              }
            })
          ])
          .setMinValues(1)
          .setMaxValues(selectedDecisionRoll.options.length)
      )

      // List Decision Roll's Outcomes
      await i.update({
        components: [decisionsDropdown, decisionOutcomeDropdown],
        embeds: []
      })
    }

    // When the collected interaction is from the Decision Outcomes list
    if (i.componentType === ComponentType.SelectMenu && i.customId === 'outcomes') {
      // Disable Outcome Selector
      decisionOutcomeDropdown.components[0].setDisabled(true)

      i.values.forEach((id) => selectedOutcomeIDs.push(id))
      await i.update({ components: [decisionsDropdown, decisionOutcomeDropdown, confirmation], content: `Are you sure you wish to remove the selected outcomes?`, embeds: [] })
    }

    if (i.componentType === ComponentType.Button && i.customId === 'yes') {
      let deleteCount = 0
      for (let index = 0; index < selectedOutcomeIDs.length; index++) {
        // Remove from DB
        const removedCount = await routed.bot.DB.update(
          'decision',
          { $or: [{ authorID: routed.author.id }, { managers: { $in: [routed.author.id] } }], 'options._id': new ObjectID(selectedOutcomeIDs[index]) },
          { $pull: { options: { _id: new ObjectID(selectedOutcomeIDs[index]) } } },
          { atomic: true }
        )

        if (removedCount) deleteCount++
      }

      if (deleteCount > 0) await i.update({ components: [], content: `Removed \`${deleteCount}\` Outcomes from the Decision Roller.`, embeds: [] })
      collector.stop()
    }

    if (i.componentType === ComponentType.Button && i.customId === 'no') {
      await i.update({ components: [], content: 'Cancelled Decision Roll Option Removal.', embeds: [] })
      collector.stop()
    }
  })

  // Send message w/dropdown to determine which Decision to modify
  if (decisionsStored.length) {
    await routed.reply(
      {
        components: [decisionsDropdown]
      },
      true
    )
  }

  // Nothing to remove - notify caller
  return await routed.reply('Could not find a Decision Roller with that ID.', true)
}
