import * as EightBall from '@/commands/fun/8ball.cmd'

import { ExportRoutes } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes({
  category: 'Fun',
  controller: EightBall.shake,
  name: 'eightball',
  permissions: {
    serverOnly: false
  },
  slash: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the 8ball a question')
    .addStringOption((option) => option.setName('question').setDescription('Enter your question here')),
  type: 'interaction'
})
