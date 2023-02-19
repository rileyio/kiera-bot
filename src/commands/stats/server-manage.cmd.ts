import { AcceptedResponse, RoutedInteraction } from '@/router'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageComponentInteraction, TextChannel } from 'discord.js'
import { StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'

export async function disableServerStats(routed: RoutedInteraction): AcceptedResponse {
  // Delete any existing record
  await routed.bot.DB.remove(
    'stats-settings',
    {
      $or: [
        {
          setting: StatisticsSettingType.ServerDisableStats
        },
        {
          setting: StatisticsSettingType.ServerEnableStats
        }
      ],
      serverID: routed.guild.id
    } as any,
    { deleteOne: false }
  )

  // Update live stats whitelist
  routed.bot.Statistics.unWhitelistServer(routed.guild.id)

  await routed.bot.DB.add(
    'stats-settings',
    new StatisticsSetting({
      serverID: routed.guild.id,
      setting: StatisticsSettingType.ServerDisableStats,
      userID: routed.author.id
    })
  )

  return await routed.reply(routed.$render('Stats.Server.Disabled'))
}

export async function enableServerStats(routed: RoutedInteraction) {
  // Delete any existing record
  await routed.bot.DB.remove(
    'stats-settings',
    {
      $or: [
        {
          setting: StatisticsSettingType.ServerDisableStats
        },
        {
          setting: StatisticsSettingType.ServerEnableStats
        }
      ],
      serverID: routed.guild.id
    } as any,
    { deleteOne: false }
  )

  // Update live stats whitelist
  routed.bot.Statistics.whitelistServer(routed.guild.id)

  // Add new enabled record
  await routed.bot.DB.add('stats-settings', {
    serverID: routed.guild.id,
    setting: StatisticsSettingType.ServerEnableStats,
    userID: routed.author.id
  })

  return await routed.reply(routed.$render('Stats.Server.Enabled'))
}

export async function deleteServerStats(routed: RoutedInteraction) {
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
          const removed = await routed.bot.DB.remove('stats-servers', { serverID: routed.guild.id }, { deleteOne: false })

          // Respond with count of removed stats
          await i.update({ components: [], content: routed.$render('Stats.Server.DeletionDeleted', { count: removed }), embeds: [] })
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
              .setDescription('This will delete all existing server statistics and is irreversible!')
              .setTitle('Confirm Deletion of ALL Server Statistics')
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
  else return await routed.reply(routed.$render('Stats.Server.DeletionNoStats'))
}
