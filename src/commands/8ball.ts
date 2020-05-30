import { RouterRouted, ExportRoutes } from '@/router'
import { eightBallResult } from '@/embedded/8ball-embed'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Fun',
  controller: eightBall,
  description: 'Help.Fun.EightBall.Description',
  example: '{{prefix}}8ball',
  name: '8ball',
  validate: '/8ball:string/question?=string',
  permissions: { serverOnly: false }
})

/**
 * 8 Ball
 * @export
 * @param {RouterRouted} routed
 */
export async function eightBall(routed: RouterRouted) {
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

  await routed.message.reply(eightBallResult(routed.v.o.question || '', outcomes[Math.floor(Math.random() * Number(outcomes.length)) + 1]))
  return true
}
