import { AcceptedResponse, Routed } from '#router/index'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction, TextChannel } from 'discord.js'
import { StatisticsSetting, StatisticsSettingType } from '#objects/statistics'

export async function disableChannelStats(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  await routed.bot.DB.add(
    'stats-settings',
    new StatisticsSetting({
      channelID: routed.channel.id,
      serverID: routed.guild.id,
      setting: StatisticsSettingType.ChannelDisableStats,
      userID: routed.author.id
    })
  )

  return await routed.reply(routed.$render('Stats.Channel.Disabled'))
}

export async function enableChannelStats(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const removed = await routed.bot.DB.remove('stats-settings', {
    channelID: routed.channel.id,
    serverID: routed.guild.id,
    setting: StatisticsSettingType.ChannelDisableStats,
    userID: routed.author.id
  })

  if (removed > 0) return await routed.reply(routed.$render('Stats.Channel.Enabled'))
  return await routed.reply('Channel Should already be Enabled to Collect Stats - As long as Server Stats & Individual Users are not set to Stats: Disabled.')
}

export async function deleteChannelStats(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  // First check if there's even anything to delete
  const count = await routed.bot.DB.count('stats-servers', { serverID: routed.guild.id })

  if (count > 0) {
    try {
      // Filter to watch for user reponse
      const filter = (i: MessageComponentInteraction) => i.user.id === routed.author.id

      // Confirmation Buttons
      const confirmation = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(new ButtonBuilder().setCustomId('yes').setLabel('Yes, Delete').setStyle(ButtonStyle.Danger))
        .addComponents(new ButtonBuilder().setCustomId('no').setLabel('Cancel Deletion').setStyle(ButtonStyle.Success))

      // Collector to recieve interaction (With 15s timeout)
      const collector = (routed.interaction.channel as TextChannel).createMessageComponentCollector({ filter, time: 15000 })
      collector.on('collect', async (i: MessageComponentInteraction) => {
        console.log('🧠 Processing user input')

        if (i.customId === 'yes') {
          // await i.update({ components: [], content: '🗑 Deleting...' })

          // Perform deletion and return number of records removed
          const removed = await routed.bot.DB.remove(
            'stats-servers',
            {
              channelID: routed.channel.id,
              serverID: routed.guild.id
            },
            { deleteOne: false }
          )

          // Respond with count of removed stats
          await i.update({ components: [], content: routed.$render('Stats.Channel.DeletionDeleted', { count: removed }), embeds: [] })
        }
        if (i.customId === 'no') await i.update({ components: [], content: 'Deletion Cancelled.', embeds: [] })

        // Stop Collecting
        collector.stop()
      })

      // Send message to seek confirmation
      await routed.reply(
        {
          components: [confirmation],
          embeds: [
            new EmbedBuilder()
              .setColor('#cb0101')
              .setDescription('This will delete all existing channel statistics and is irreversible!')
              .setTitle('Confirm Deletion of Channel Statistics')
          ]
        },
        true
      )

      // When command is completed
    } catch (error) {
      return await routed.reply('Deletion Cancelled.')
    }
  }

  // Nothing to delete - notify caller
  else return await routed.reply(routed.$render('Stats.Channel.DeletionNoStats'))
}
