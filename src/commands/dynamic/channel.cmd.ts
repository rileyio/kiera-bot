import { ChannelType, EmbedBuilder, PermissionFlagsBits } from 'discord.js'

import { RoutedInteraction } from '@/router'
import moment = require('moment')

export async function create(routed: RoutedInteraction) {
  try {
    // Verify that user has permissions to create a managed channel
    const user = routed.interaction.guild.members.cache.get(routed.interaction.user.id)

    if (!user.permissions.has('ManageChannels')) {
      return await routed.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setColor(15548997)
              .setTitle('User Missing Permissions')
              .setDescription('You do not have Manage Channels permission.')
              .setFooter({
                iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
                text: 'Error from Kiera'
              })
              .setTimestamp(Date.now())
          ]
        },
        true
      )
    }

    // Verify that bot has required permissions to create and manage channels
    const botUser = routed.interaction.guild.members.cache.get(routed.bot.client.user.id)
    if (!botUser.permissions.has('ManageChannels')) {
      return await routed.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setColor(15548997)
              .setTitle('Missing Permissions')
              .setDescription('I need the `Manage Channels` permission to create & manage channels.')
              .setFooter({
                iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
                text: 'Error from Kiera'
              })
              .setTimestamp(Date.now())
          ]
        },
        true
      )
    }

    const name = routed.interaction.options.get('name')?.value as string
    const type = routed.interaction.options.get('type')?.value as string
    const value = routed.interaction.options.get('value')?.value as number

    // Create a new channel to manage
    const newChannel = await routed.interaction.guild.channels.create({
      name,
      permissionOverwrites: [
        {
          allow: [PermissionFlagsBits.ViewChannel],
          id: routed.bot.client.user.id
        }
      ],
      type: ChannelType.GuildVoice
    })

    // If the bot has admin permissions
    if (botUser.permissions.has('Administrator'))
      newChannel.edit({
        permissionOverwrites: [
          {
            deny: [PermissionFlagsBits.Connect],
            id: routed.interaction.guild.roles.everyone.id
          }
        ]
      })

    // If its a countdown, update the value now as the next run wont be for 10 minutes
    if (type === 'countdown') await newChannel.edit({ name: name.replace('{#}', moment.unix(value).fromNow()) })

    // Track managed channel in DB
    await routed.bot.DB.add('managed', {
      authorID: routed.interaction.user.id,
      channelID: newChannel.id,
      enabled: true,
      name,
      serverID: routed.interaction.guild.id,
      type,
      updated: moment.now(),
      value
    })

    // If the bot is missing permissions to deny @everyone from connecting to the channel, warn the user
    if (!botUser.permissions.has('Administrator'))
      return await routed.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setColor(15105570)
              .setTitle('Managed Channel Setup but Missing @everyone Permissions')
              .setDescription('You probably want to deny @everyone from connecting to this channel if intending to just have a countdown.')
              .setFooter({
                iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
                text: 'Info from Kiera'
              })
              .setTimestamp(Date.now())
          ]
        },
        true
      )

    // Reply to user
    return await routed.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setColor(7419530)
            .setTitle('Managed Channel Setup Complete')
            .setDescription('The channel will only update once every 5 minutes. If you wish to remove this channel, simply delete it.')
            .setFooter({
              iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
              text: 'Info from Kiera'
            })
            .setTimestamp(Date.now())
        ]
      },
      true
    )
  } catch (error) {
    console.log(error)
  }
}
