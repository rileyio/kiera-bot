import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, TextChannel } from 'discord.js'

import { Routed } from '#router/index'
import { TrackedDecision } from '#objects/decision'
import { embed } from '#commands/decision/list.embed'

export async function list(routed: Routed<'discord-chat-interaction'>) {
  const authorID = routed.author.id
  const decisionsStored = (await routed.bot.DB.getMultiple('decision', { authorID })) as Array<TrackedDecision>

  if (!decisionsStored.length) {
    return await routed.reply('There Are No Decision Rollers to List.')
  }

  try {
    // Display options
    const outputOptions = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(new ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Secondary).setDisabled(true))
      .addComponents(new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Secondary))

    // Display first page if = 0
    let seek = 0

    // Collector to recieve interaction (With 5m timeout)]
    console.log('Collector Started!')

    const collector = (routed.interaction.channel as TextChannel).createMessageComponentCollector({ time: 5 * (60 * 1000) })
    collector?.on('collect', async (i: ButtonInteraction) => {
      // Disable 'previous' button when going to the first page
      if (i.customId === 'previous' && seek === 3) outputOptions.components[0].setDisabled(true)

      // Output Button Responses
      if (i.customId === 'previous' && seek !== 0) {
        // If the seek coming into this step is not 3, then we can enable the 'previous' button
        if (seek !== 3) outputOptions.components[0].setDisabled(false)
        // Enable the 'next' button
        outputOptions.components[1].setDisabled(false)
        seek = seek - 3
        await i.update({ components: [outputOptions], embeds: [embed(authorID, decisionsStored.slice(seek, seek + 3))] })
      }
      if (i.customId === 'next') {
        // Enable the 'previous' button
        outputOptions.components[0].setDisabled(false)
        seek = seek + 3
        // Disable the 'next' button if we are at the end of the list
        if (seek + 3 >= decisionsStored.length) outputOptions.components[1].setDisabled(true)
        await i.update({ components: [outputOptions], embeds: [embed(authorID, decisionsStored.slice(seek, seek + 3))] })
      }
    })

    collector?.on('end', async (collected, reason) => {
      if (reason && reason !== 'stopped') {
        routed.interaction.editReply({
          components: []
        })
      }
    })

    return routed.reply(
      decisionsStored.length > 3
        ? // When more than 3, display options
          { components: [outputOptions], embeds: [embed(authorID, decisionsStored.slice(seek, seek + 3))] }
        : { embeds: [embed(authorID, decisionsStored)] },
      true
    )
  } catch (error) {
    console.error(error)
  }
}
