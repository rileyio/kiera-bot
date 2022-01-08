import * as EightBall from '@/commands/fun/8ball.cmd'
import * as Flip from '@/commands/fun/flip.cmd'
import * as Roll from '@/commands/fun/roll.cmd'

import { ExportRoutes } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes(
  {
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
  },
  {
    category: 'Fun',
    controller: Flip.flip,
    description: 'Help.Fun.Flip.Description',
    name: 'flip-coin',
    permissions: {
      serverOnly: false
    },
    slash: new SlashCommandBuilder().setName('flip').setDescription('Flip a coin'),
    type: 'interaction'
  },
  {
    category: 'Fun',
    controller: Roll.roll,
    description: 'Help.Fun.Roll.Description',
    name: 'roll-die',
    permissions: {
      serverOnly: false
    },
    slash: new SlashCommandBuilder()
      .setName('roll')
      .setDescription('Roll 1 or more dice')
      .addIntegerOption((option) => option.setName('sides').setDescription('Number of sides for the dice'))
      .addIntegerOption((option) => option.setName('dice').setDescription('Number of dice to roll')),
    type: 'interaction'
  }
)
