import { ExportRoutes, RoutedInteraction } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes({
  category: 'Admin',
  controller: ckStatsRouterSub,
  name: 'command',
  permissions: {
    defaultEnabled: true,
    serverAdminOnly: true,
    serverOnly: true
  },
  slash: new SlashCommandBuilder()
    .setName('command')
    .setDescription('Manage Commands on this Discord Server')
    .setDefaultPermission(true) // Settings for an entire Category/Group that commands fall within
    .addSubcommand(
      (subcommand) =>
        subcommand
          .setName('category')
          .setDescription('Toggle a whole Category of Commands') // Enable Group of Commands
          .addStringOption((option) =>
            option
              .setName('enable')
              .setDescription('Enable a Category/Group that multiple command fall within')
              .addChoice('Battle.Net Commands (3rd Party)', 'bnet')
              .addChoice('ChastiKey (18+ NSFW Channel Req.)', 'chastikey')
              .addChoice('Dice, Coins, etc', 'fun')
          ) // Disable Group of Commands
          .addStringOption((option) =>
            option
              .setName('disable')
              .setDescription('Disable a Category/Group that multiple command fall within')
              .addChoice('Battle.Net Commands (3rd Party)', 'bnet')
              .addChoice('ChastiKey (18+ NSFW Channel Req.)', 'chastikey')
              .addChoice('Dice, Coins, etc', 'fun')
          ) // )
      // // Toggles for single commands
      // .addSubcommand((subcommand) =>
      //   subcommand
      //     .setName('channel')
      //     .setDescription('Battle.Net Commands (3rd Party)')
      //     // Enable Group of Commands
      //     .addStringOption((option) =>
      //       option
      //         .setName('enable')
      //         .setDescription('Enable a Category/Group that multiple command fall within')
      //         .setRequired(true)
      //         .addChoice('Battle.Net Commands (3rd Party)', 'bnet')
      //         .addChoice('ChastiKey (18+ NSFW Channel Req.)', 'ck')
      //         .addChoice('Dice, Coins, etc', 'fun')
      //     )
      //     // Disable Group of Commands
      //     .addStringOption((option) =>
      //       option
      //         .setName('disable')
      //         .setDescription('Disable a Category/Group that multiple command fall within')
      //         .setRequired(true)
      //         .addChoice('Battle.Net Commands (3rd Party)', 'bnet')
      //         .addChoice('ChastiKey (18+ NSFW Channel Req.)', 'ck')
      //         .addChoice('Dice, Coins, etc', 'fun')
      //     )
    ),
  type: 'interaction'
})

async function ckStatsRouterSub(routed: RoutedInteraction) {
  const subCommand = routed.interaction.options.getSubcommand()
  const enable = routed.interaction.options.get('enable')?.value
  const disable = routed.interaction.options.get('disable')?.value
  const commands = await routed.guild.commands.fetch()
  const commandMapped = commands.map((c) => {
    return {
      defaultPermission: c.defaultPermission,
      description: c.description,
      guildId: c.guildId,
      id: c.id,
      name: c.name
    }
  })
  console.log('subCommand:', subCommand, enable || disable)
  console.log('commands from lookup:', commandMapped)

  if (subCommand === 'category') {
    const commandsFromKiera = routed.bot.Router.routes.filter((r) => r.category.toLowerCase() === enable || disable)
    const permissions = [
      {
        id: '224617799434108928',
        permission: false,
        type: 'USER'
      }
    ]

    console.log('commandsFromKiera:', commandsFromKiera)
    console.log('permissions:', permissions)
    // return routed.reply({ content: 'yep.. did a thing' })
  }

  console.log('enable:', enable)
  // console.log('commandsfrom kiera lookup:', commandMapped)
  // return routed.reply({ content: 'yep.. did a thing' })
  // const subCommand = routed.interaction.options.getSubcommand()
  // const interactionType = routed.interaction.options.get('type')?.value

  // // Stats
  // if (subCommand === 'stats') {
  //   if (interactionType === 'lockee') return CKStats.getLockeeStats(routed)
  //   if (interactionType === 'lockees') return CKStats.getKeyholderLockees(routed)
  //   if (interactionType === 'keyholder') return CKStats.getKeyholderStats(routed)
  //   if (interactionType === 'multilocked') return CKStats.getCheckLockeeMultiLocked(routed)
  // }

  // // Update
  // if (subCommand === 'update') return CKUpdate.update(routed)

  // // Verify
  // if (subCommand === 'verify') return CKVerify.verify(routed)
}
