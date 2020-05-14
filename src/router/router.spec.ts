import test from 'ava'
import { MessageRoute, CommandRouter } from '@/router'
import { Bot } from '@/index'
import { setTickerType } from '@/commands/chastikey/ticker'

var router: CommandRouter
var bot: Bot = new Bot()

test('Utils:CommandRouter', (t) => {
  router = new CommandRouter(
    [
      {
        type: 'message',
        category: 'Info',
        controller: () => {},
        example: '{{prefix}}duration @user#0000 time 10',
        name: 'duration-set-time',
        validate: '/command:string/user=user/action/time=number'
      },
      {
        type: 'message',
        category: 'Info',
        controller: setTickerType,
        example: '{{prefix}}ck ticker set type 2',
        name: 'ticker-set-type',
        validate: '/command:string/subroute:string/action:string/action2:string/type=number'
      }
    ],
    bot
  )

  t.pass()
})

test('Utils:CommandRouter:Route => Generate Route', (t) => {
  const r = new MessageRoute({
    type: 'message',
    category: 'Info',
    controller: setTickerType,
    example: '{{prefix}}ck ticker set type 2',
    name: 'ticker-set-type',
    validate: '/command:string/subroute:string/action:string/action2:string/type=number'
  })

  t.pass()
})
