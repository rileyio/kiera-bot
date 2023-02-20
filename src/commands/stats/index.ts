import * as About from '@/commands/stats/about.cmd'
import * as StatsChannel from '@/commands/stats/channel.cmd'
import * as StatsChannelManage from '@/commands/stats/channel-manage.cmd'
import * as StatsServer from '@/commands/stats/stats-server.cmd'
import * as StatsServerManage from '@/commands/stats/server-manage.cmd'
import * as StatsUser from '@/commands/stats/user.cmd'
import * as StatsUserManage from '@/commands/stats/user-manage.cmd'

import { AcceptedResponse, ExportRoutes, RouteConfiguration, Routed } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes(
  new RouteConfiguration({
    category: 'Stats',
    controller: stats,
    name: 'stats',
    permissions: {
      defaultEnabled: true,
      serverOnly: true
    },
    slash: new SlashCommandBuilder()
      .setName('stats')
      .setDescription('Server/Channel/User Stats') // .addSubcommand((subcommand) => subcommand.setName('server').setDescription('Server Stats'))
      // * /stats about ...
      .addSubcommand((subcommand) => subcommand.setName('about').setDescription('About Statistics'))
      // * /stats server ...
      .addSubcommand((subcommand) => subcommand.setName('server').setDescription('Server Statistics'))
      // * /stats channel ...
      .addSubcommand((subcommand) =>
        subcommand
          .setName('channel')
          .setDescription('Channel Statistics')
          .addChannelOption((option) => option.setName('target').setDescription('Target a Different Channel').setRequired(false))
      )
      // * /stats user ...
      .addSubcommand((subcommand) =>
        subcommand
          .setName('user')
          .setDescription('User Statistics')
          .addChannelOption((option) => option.setName('target').setDescription('Target a Different Channel').setRequired(false))
      )
      // * /stats delete ...
      .addSubcommand((subcommand) =>
        subcommand
          .setName('delete')
          .setDescription('Delete Stats')
          .addStringOption((option) =>
            option
              .setName('target')
              .setDescription('For Server | Channel | User')
              .setRequired(true)
              .addChoices({ name: 'Server', value: 'server' }, { name: 'Channel', value: 'channel' }, { name: 'User', value: 'user' })
          )
      )
      // * /stats enable ...
      .addSubcommand((subcommand) =>
        subcommand
          .setName('enable')
          .setDescription('Enable Stats')
          .addStringOption((option) =>
            option
              .setName('target')
              .setDescription('For Server | Channel | User')
              .setRequired(true)
              .addChoices({ name: 'Server', value: 'server' }, { name: 'Channel', value: 'channel' }, { name: 'User', value: 'user' })
          )
      )
      // * /stats disable ...
      .addSubcommand((subcommand) =>
        subcommand
          .setName('disable')
          .setDescription('Disable Stats')
          .addStringOption((option) =>
            option
              .setName('target')
              .setDescription('For Server | Channel | User')
              .setRequired(true)
              .addChoices({ name: 'Server', value: 'server' }, { name: 'Channel', value: 'channel' }, { name: 'User', value: 'user' })
          )
      ),
    type: 'discord-chat-interaction'
  })
)

function stats(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const subCommand = routed.options.getSubcommand()

  // About
  if (subCommand === 'about') return About.aboutStats(routed)

  // Server
  if (subCommand === 'server') {
    return StatsServer.get(routed)
  }

  // Channel
  if (subCommand === 'channel') {
    return StatsChannel.get(routed)
  }

  // Server
  if (subCommand === 'user') {
    return StatsUser.get(routed)
  }

  // Delete
  if (subCommand === 'delete') {
    const interactionTarget = routed.interaction.options.get('target')?.value
    if (interactionTarget === 'server') return StatsServerManage.deleteServerStats(routed)
    if (interactionTarget === 'channel') return StatsChannelManage.deleteChannelStats(routed)
    if (interactionTarget === 'user') return StatsUserManage.deleteUserStats(routed)
  }

  // Enable
  if (subCommand === 'enable') {
    const interactionTarget = routed.interaction.options.get('target')?.value
    if (interactionTarget === 'server') return StatsServerManage.enableServerStats(routed)
    if (interactionTarget === 'channel') return StatsChannelManage.enableChannelStats(routed)
    if (interactionTarget === 'user') return StatsUserManage.enableUserStats(routed)
  }

  // Disable
  if (subCommand === 'disable') {
    const interactionTarget = routed.interaction.options.get('target')?.value
    if (interactionTarget === 'server') return StatsServerManage.disableServerStats(routed)
    if (interactionTarget === 'channel') return StatsChannelManage.disableChannelStats(routed)
    if (interactionTarget === 'user') return StatsUserManage.diableUserStats(routed)
  }
}
