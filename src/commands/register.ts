import * as Utils from '@/utils'

import { ExportRoutes, RoutedInteraction } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'
import { TrackedUser } from '@/objects/user'

export const Routes = ExportRoutes({
  category: 'User',
  controller: registerUser,
  description: 'Help.User.Register.Description',
  name: 'register',
  slash: new SlashCommandBuilder().setName('register').setDescription('Register with the Bot'),
  type: 'interaction'
})

export async function registerUser(routed: RoutedInteraction) {
  if (!(await routed.bot.DB.verify('users', { id: routed.user.id }))) {
    // If not yet registered, store user in db
    await routed.bot.DB.add('users', new TrackedUser({ id: routed.user.id }))
    return await routed.reply(`:white_check_mark: You're now registered! ^_^`, true)
  } else {
    return await routed.reply(`You're already registered! :blush:`, true)
  }
}
