import { ExportRoutes, RoutedInteraction } from '@/router'

import { PermissionFlagsBits } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import { checkForUpdates } from '@/commands/plugins/update'

export const Routes = ExportRoutes({
  category: 'Plugin',
  controller: stats,
  name: 'plugins',
  permissions: {
    defaultEnabled: true,
    restrictedTo: [
      '146439529824256000' // Emma#1366
    ],
    serverOnly: true
  },
  slash: new SlashCommandBuilder()
    .setName('plugins')
    .setDescription('Plugin')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // * /plugin check-for-updates
    .addSubcommand((subcommand) => subcommand.setName('check-for-updates').setDescription('Check for Plugin Updates')),
  type: 'interaction'
})

async function stats(routed: RoutedInteraction) {
  const subCommand = (<any>routed.interaction.options).getSubcommand() as 'check-for-updates'

  // Check for updates
  if (subCommand === 'check-for-updates') return await checkForUpdates(routed)
}
