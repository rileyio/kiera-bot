import { AcceptedResponse, ExportRoutes, RouteConfiguration, RouteConfigurationAutocompleteOptions, Routed } from '#router/index'
import { checkForUpdates, update } from '#commands/plugins/update'

import { PermissionFlagsBits } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders'
import { reload } from './reload'

export const Routes = ExportRoutes(
  new RouteConfiguration({
    autocomplete: {
      optionsFn: pluginNamesAutocomplete
    },
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
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('reload')
          .setDescription('Reload existing Plugin')
          .addStringOption((option) => option.setName('name').setDescription('Name of Plugin').setRequired(true).setAutocomplete(true))
      ),
    type: 'discord-chat-interaction'
  })
)

async function pluginNamesAutocomplete(routed: Routed<'discord-chat-interaction-autocomplete'>): Promise<RouteConfigurationAutocompleteOptions> {
  const plugins = await routed.bot.Plugin.pluginsActive
  return {
    name: plugins.map((plugin) => {
      return {
        name: plugin.name,
        value: plugin.name
      }
    })
  }
}

async function stats(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const subCommand = routed.options.getSubcommand() as 'check-for-updates' | 'update' | 'reload'

  // Check for updates
  switch (subCommand) {
    case 'check-for-updates':
      return await checkForUpdates(routed)

    case 'update':
      return await update(routed)

    case 'reload':
      return await reload(routed)

    default:
      break
  }
}
