import { ExportRoutes, RouterRouted } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'
import { eightBallResult } from '@/embedded/8ball-embed'

export const Routes = ExportRoutes({
  category: 'Fun',
  controller: eightBall,
  description: 'Help.Fun.EightBall.Description',
  name: '8ball',
  permissions: {
    serverOnly: false
  },
  slash: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the 8ball a question')
    .addStringOption((option) => option.setName('question').setDescription('Enter your question here')),
  type: 'interaction'
})

/**
 * 8 Ball
 * @export
 * @param {RouterRouted} routed
 */
export async function eightBall(routed: RouterRouted) {
  const question = routed.interaction.options.get('question')?.value as string
  const outcomes = [
    'It is certain',
    'It is decidedly so',
    'Without a doubt',
    'Yes - definitely',
    'You may rely on it',
    'As I see it, yes',
    'Most likely',
    'Outlook good',
    'Yes',
    'Signs point to yes',

    'Reply hazy, try again',
    'Ask again later',
    'Better not tell you now',
    'Cannot predict now',
    'Concentrate and ask again',

    `Don't count on it`,
    'My reply is no',
    'My sources say no',
    'Outlook not so good',
    'Very doubtful'
  ]

  await routed.reply({
    embeds: [eightBallResult(question || '', outcomes[Math.floor(Math.random() * Number(outcomes.length)) + 1])]
  })
  return true
}
