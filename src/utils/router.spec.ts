import test from 'ava'
import { Route, Router } from './router'
import { Bot } from '..';

var router: Router;
var bot: Bot = new Bot()

test('Utils:Router', t => {
  router = new Router([
    {
      controller: () => { /* do something here */ },
      example: '!duration @user#0000 time 10',
      help: 'duration',
      name: 'duration-set-time',
      validate: '/command:string/user=user/action/time=number'
    },
    {
      controller: () => { /* do something here */ },
      example: '!ck ticker set type 2',
      help: 'ck',
      name: 'ticker-set-type',
      validate: '/command:string/subroute:string/action:string/action2:string/type=number'
    }
  ], bot)

  t.pass()
})

test('Utils:Router:Route => Generate Route', t => {
  const r = new Route({
    controller: () => { /* do something here */ },
    example: '!ck ticker set type 2',
    help: 'ck',
    name: 'ticker-set-type',
    validate: '/command:string/subroute:string/action:string/action2:string/type=number'
  })

  t.pass()
})

