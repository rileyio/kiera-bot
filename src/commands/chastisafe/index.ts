import * as User from '@/commands/chastisafe/user.cmd'

import { ExportRoutes, RoutedInteraction } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes({
  category: 'Fun',
  controller: csRouterSub,
  name: 'cs',
  permissions: {
    defaultEnabled: false,
    serverOnly: false
  },
  slash: new SlashCommandBuilder()
    .setName('cs')
    .setDescription('ChastiSafe Commands')
    // * Lookup
    .addSubcommand((subcommand) =>
      subcommand
        .setName('lookup')
        .setDescription('Lookup on ChastiSafe')
        .addStringOption((option) => option.setName('username').setDescription('Specify Username like user#1234').setRequired(false))
        .addUserOption((option) => option.setName('user').setDescription('Specify Username like @User').setRequired(false))
    ),
  type: 'interaction'
})

async function csRouterSub(routed: RoutedInteraction) {
  const subCommand = routed.interaction.options.data[0].name as 'lookup'
  // const username = routed.interaction.options.get('username')?.value
  // const user = routed.interaction.options.getUser('user')
  // const interactionType = routed.interaction.options.get('type')?.value

  // Lookup
  if (subCommand === 'lookup') {
    return await User.lookupUser(routed)
  }

  // Full criteria or another reason has resulted in this outcome
  return await routed.reply('Command criteria incomplete')
}
