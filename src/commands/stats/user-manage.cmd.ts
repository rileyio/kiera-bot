import { MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed } from 'discord.js'
import { StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'

import { RoutedInteraction } from '@/router'

export async function diableUserStats(routed: RoutedInteraction) {
  await routed.bot.DB.add(
    'stats-settings',
    new StatisticsSetting({
      setting: StatisticsSettingType.UserDisableStats,
      userID: routed.author.id
    })
  )

  return await routed.reply(routed.$render('Stats.User.Disabled'))
}

export async function enableUserStats(routed: RoutedInteraction) {
  const removed = await routed.bot.DB.remove('stats-settings', {
    setting: StatisticsSettingType.UserDisableStats,
    userID: routed.author.id
  })

  if (removed > 0) return await routed.reply(routed.$render('Stats.User.Enabled'))
}

export async function deleteUserStats(routed: RoutedInteraction) {
  // First check if there's even anything to delete
  const count = await routed.bot.DB.count('stats-servers', { userID: routed.author.id })

  // Nothing to delete - notify caller
  if (count > 0) {
    try {
      // Filter to watch for user reponse
      const filter = (i: MessageComponentInteraction) => i.user.id === routed.author.id

      // Confirmation Buttons
      const confirmation = new MessageActionRow()
        .addComponents(new MessageButton().setCustomId('yes').setLabel('Yes, Delete').setStyle('DANGER'))
        .addComponents(new MessageButton().setCustomId('no').setLabel('Cancel Deletion').setStyle('SUCCESS'))

      // Collector to recieve interaction (With 15s timeout)
      const collector = routed.interaction.channel.createMessageComponentCollector({ filter, time: 15000 })
      collector.on('collect', async (i: MessageComponentInteraction) => {
        console.log('🧠 Processing user input')

        // When its not the author interacting, skip
        if (i.user.id !== routed.author.id) return

        if (i.customId === 'yes') {
          // await i.update({ components: [], content: '🗑 Deleting...' })

          // Perform deletion and return number of records removed
          // Delete from DB
          const removed = await routed.bot.DB.remove(
            'stats-servers',
            {
              userID: routed.author.id
            },
            { deleteOne: false }
          )

          // Respond with count of removed stats
          await i.update({ components: [], content: `Stats \`(count: ${removed})\` for your account have been deleted!`, embeds: [] })
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
            new MessageEmbed()
              .setColor('#cb0101')
              .setDescription('This will delete all your existing user statistics and is irreversible!')
              .setTitle('Confirm Deletion of User Statistics')
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
  else return await routed.reply(`There are no stats stored for your account!`)
}
