import test from 'ava';
import { Route, Router } from './router';
import { Bot } from '..';
import * as Commands from '../controllers/commands';

var router: Router;
var bot: Bot = new Bot()

test('Utils:Router', t => {
  router = new Router([
    {
      commandTarget: 'argument',
      controller: Commands.setDurationTime,
      example: '!duration @user#0000 time 10',
      help: 'duration',
      name: 'duration-set-time',
      validate: '/command:string/user=user/action/time=number'
    },
    {
      commandTarget: 'author',
      controller: Commands.setTickerType,
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
    commandTarget: 'author',
    controller: Commands.setTickerType,
    example: '!ck ticker set type 2',
    help: 'ck',
    name: 'ticker-set-type',
    validate: '/command:string/subroute:string/action:string/action2:string/type=number'
  })

  t.pass()
})

