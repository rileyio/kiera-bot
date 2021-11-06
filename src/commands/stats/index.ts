import * as Middleware from '@/middleware'
import * as About from '@/commands/stats/about'
import * as StatsServer from '@/commands/stats/server'
import { SlashCommandBuilder } from '@discordjs/builders'
import { ExportRoutes, RoutedInteraction } from '@/router'

export const Routes = ExportRoutes({
  type: 'interaction',
  category: 'Stats',
  controller: stats,
  middleware: [Middleware.isCKVerified],
  name: 'stats',
  permissions: {
    defaultEnabled: true,
    serverOnly: true
  },
  slash: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Server/Channel/User Stats')
    // .addSubcommand((subcommand) => subcommand.setName('server').setDescription('Server Stats'))
    .addStringOption((option) =>
      option.setName('type').setDescription('Server Stats').setRequired(true).addChoice('About', 'about').addChoice('Channel', 'channel').addChoice('User', 'user')
    )
})

function stats(routed: RoutedInteraction) {
  // const subCommand = routed.interaction.options.getSubcommand()
  const interactionType = routed.interaction.options.get('type')?.value

  // About
  if (interactionType === 'about') return About.aboutStats(routed)

  // Server
  if (interactionType === 'server') return StatsServer.serverStats(routed)
}