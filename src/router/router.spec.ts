import { CommandRouter, MessageRoute } from '@/router'

import { Bot } from '@/index'
import { setTickerType } from '@/commands/chastikey/ticker'
import test from 'ava'

let router: CommandRouter
const bot = new Bot()

test('Utils:CommandRouter', (t) => {
  router = new CommandRouter(
    [
      {
        category: 'Info',
        controller: () => {
          console.log('...')
        },
        example: '{{prefix}}duration @user#0000 time 10',
        name: 'duration-set-time',
        type: 'message',
        validate: '/command:string/user=user/action/time=number'
      },
      {
        category: 'Info',
        controller: setTickerType,
        example: '{{prefix}}ck ticker set type 2',
        name: 'ticker-set-type',
        type: 'message',
        validate: '/command:string/subroute:string/action:string/action2:string/type=number'
      }
    ],
    bot
  )

  t.pass()
})

test('Utils:CommandRouter:Route => Generate Route', (t) => {
  const r = new MessageRoute({
    category: 'Info',
    controller: setTickerType,
    example: '{{prefix}}ck ticker set type 2',
    name: 'ticker-set-type',
    type: 'message',
    validate: '/command:string/subroute:string/action:string/action2:string/type=number'
  })

  t.pass()
})
