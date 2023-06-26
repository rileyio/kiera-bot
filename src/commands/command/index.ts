import { ExportRoutes, RouteConfiguration, Routed } from '#router/index'

import { AcceptedResponse } from '#router/index'
import { Routes as DiscRoutes } from 'discord-api-types/v10'
import { REST } from '@discordjs/rest'
import { SlashCommandBuilder } from '@discordjs/builders'
import { Secrets } from '#utils'

export const Routes = ExportRoutes(
  new RouteConfiguration({
    category: 'Admin',
    controller: command,
    name: 'xtcommand',
    permissions: {
      defaultEnabled: true,
      serverAdminOnly: true,
      serverOnly: true
    },
    slash: new SlashCommandBuilder()
      .setName('xtcommand')
      .setDescription('Manage OptIn Commands on this Discord Server')
      // Enable Group of Commands
      .addSubcommand((subcommand) =>
        subcommand
          .setName('enable')
          .setDescription('Enable Category of OptIn Commands')
          .addStringOption((option) => option.setName('category').setDescription('Enable a Category that multiple command fall within').setRequired(true))
      )
      // Disable Group of Commands
      .addSubcommand((subcommand) =>
        subcommand
          .setName('disable')
          .setDescription('Disable Category of OptIn Commands')
          .addStringOption((option) => option.setName('category').setDescription('Disable a Category that multiple command fall within').setRequired(true))
      ),
    // .addSubcommand(
    //   (subcommand) =>
    //     subcommand
    //       .setName('disable')
    //       .setDescription('Toggle a whole Category of Commands')
    //       // Enable Group of Commands
    //       .addStringOption((option) =>
    //         option
    //           .setName('category')
    //           .setDescription('Enable a Category/Group that multiple command fall within')
    //           .addChoices({ name: 'Battle.Net Commands (3rd Party)', value: 'bnet' }, { name: 'Dice, Coins, etc', value: 'fun' })
    //       ) // Disable Group of Commands
    // ),
    type: 'discord-chat-interaction'
  })
)

async function command(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  const subCommand = routed.options.getSubcommand(true) as 'enable' | 'disable'
  const commandCategory = routed.interaction.options.getString('category', true)
  console.log('subCommand', subCommand)
  console.log('commandCategory', commandCategory)
  // const commands = await routed.guild.commands.fetch()
  // const commandMapped = commands.map((c) => {
  //   return {
  //     defaultPermission: c.permissions,
  //     description: c.description,
  //     guildId: c.guildId,
  //     id: c.id,
  //     name: c.name
  //   }
  // })
  // console.log('subCommand:', subCommand, enable || disable)
  // console.log('commands from lookup:', commandMapped)
  try {
    // Do a quick check to see if the command name exists
    const commandExists = routed.bot.Router.routes.find((r) => r.category.toLowerCase() === commandCategory.toLowerCase())

    // Can't find the command group
    if (!commandExists) return await routed.reply({ content: `I can\'t find that command group`, ephemeral: true })

    // Get some things ready
    const rest = new REST({ version: '10' }).setToken(Secrets.read('DISCORD_APP_TOKEN', routed.bot.Log.Bot))

    // Update command category on server
    if (subCommand === 'enable') {
      // Update DB record
      await routed.bot.DB.update('servers', { id: routed.guild.id, type: 'discord' }, { $set: { [`commandGroups.command/discord/${commandCategory}`]: true } }, { atomic: true })
      // Push commands to server
      await rest.post(DiscRoutes.applicationGuildCommands(process.env.DISCORD_APP_ID, routed.guild.id), { body: commandExists.discordRegisterPayload() })
      // Inform user
      return await routed.reply({ content: `Command Category \`${commandCategory}\` is now \`Enabled\`.`, ephemeral: true })
    }
    // Disable command category on server
    if (subCommand === 'disable') {
      // Update DB record
      await routed.bot.DB.update('servers', { id: routed.guild.id, type: 'discord' }, { $set: { [`commandGroups.command/discord/${commandCategory}`]: false } }, { atomic: true })
      // Delete commands from server
      const commandsFromServer = await routed.guild.commands.fetch()
      const commandID = commandsFromServer.find((c) => c.name === commandExists.name)?.id
      await rest.delete(DiscRoutes.applicationGuildCommand(process.env.DISCORD_APP_ID, routed.guild.id, commandID))
      // Inform user
      return await routed.reply({ content: `Command Category \`${commandCategory}\` is now \`Disabled\`.`, ephemeral: true })
    }
  } catch (error) {
    console.log('error', error)
    return await routed.reply({ content: `I had an error trying to update the server settings`, ephemeral: true })
  }
}
