import { AcceptedResponse, ExportRoutes, RouteConfiguration, Routed } from '@/router'
import { checkForUpdates, update } from '@/commands/plugins/update'

import { PermissionFlagsBits } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes(
  new RouteConfiguration({
    category: 'Plugin/Admin',
    controller: stats,
    name: 'plugins',
    permissions: {
      defaultEnabled: true,
      restrictedToUser: [
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
      .addSubcommand((subcommand) => subcommand.setName('check-for-updates').setDescription('Check for Plugin Updates'))
      .addSubcommand((subcommand) =>
        subcommand
          .setName('update')
          .setDescription('Update Plugin')
          .addStringOption((option) => option.setName('name').setDescription('Name of Plugin').setRequired(true))
      ),
    type: 'discord-chat-interaction'
  })
)

async function stats(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const subCommand = routed.options.getSubcommand() as 'check-for-updates' | 'update'

  // Check for updates
  if (subCommand === 'check-for-updates') return await checkForUpdates(routed)
  if (subCommand === 'update') return await update(routed)
}
