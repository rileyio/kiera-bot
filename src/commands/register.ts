import * as Utils from '@/utils'

import { ExportRoutes, RoutedInteraction } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes({
  category: 'User',
  controller: registerUser,
  description: 'Help.User.Register.Description',
  name: 'register',
  slash: new SlashCommandBuilder().setName('register').setDescription('Register with the Bot'),
  type: 'interaction'
})

export async function registerUser(routed: RoutedInteraction) {
  const userSnowflake = routed.user.id
  const userArgType = Utils.User.verifyUserRefType(userSnowflake)
  const isRegistered = await routed.bot.DB.verify('users', userSnowflake)

  if (!isRegistered) {
    // If not yet registered, store user in db
    routed.bot.Log.Command.log(`!register ${Utils.User.buildUserChatAt(routed.member, userArgType)}`)
    return await routed.reply(`:white_check_mark: You're now registered! ^_^`, true)
  } else {
    routed.bot.Log.Command.log(`!register ${Utils.User.buildUserChatAt(userSnowflake, userArgType)} - user already registered`)
    return await routed.reply(`You're already registered! :wink:`, true)
  }
}
