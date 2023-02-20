import { ExportRoutes, RouteConfiguration, Routed } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'
import { TrackedUser } from '@/objects/user'

export const Routes = ExportRoutes(
  new RouteConfiguration({
    category: 'User',
    controller: registerUser,
    description: 'Help.User.Register.Description',
    name: 'register',
    slash: new SlashCommandBuilder().setName('register').setDescription('Register with the Bot'),
    type: 'discord-chat-interaction'
  })
)

export async function registerUser(routed: Routed<'discord-chat-interaction'>) {
  if (!(await routed.bot.DB.verify('users', { id: routed.author.id }))) {
    // If not yet registered, store user in db
    await routed.bot.DB.add('users', new TrackedUser({ id: routed.author.id }))
    return await routed.reply(`:white_check_mark: You're now registered! ^_^`, true)
  } else {
    return await routed.reply(`You're already registered! :blush:`, true)
  }
}
