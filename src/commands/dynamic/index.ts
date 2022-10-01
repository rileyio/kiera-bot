import * as Channel from '@/commands/dynamic/channel.cmd'

import { ExportRoutes, RoutedInteraction } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes({
  category: 'Managed',
  controller: managedRouterSub,
  name: 'managed',
  permissions: {
    serverOnly: true
  },
  slash: new SlashCommandBuilder()
    .setName('managed')
    .setDescription('Managed Channels')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a new Managed Channel')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('The type of Managed Channel')
            .setRequired(true)
            .setChoices(
              { name: 'Countdown', value: 'countdown' },
            )
        )
        .addStringOption((option) => option.setName('name').setDescription('Example: 🎃 Event {#}').setRequired(true))
        .addNumberOption((option) => option.setName('value').setDescription('Supply the value used by the managed type - Use epochconverter.com for Unix Timestamp').setRequired(true))
    ),
  type: 'interaction'
})

async function managedRouterSub(routed: RoutedInteraction) {
  const subcommand = routed.interaction.options.getSubcommand()

  // Manage a managed channel
  if (subcommand === 'create') await Channel.create(routed)

  // Nothing has been specified
  await routed.reply('Please check your input and try again.')
  return true
}
