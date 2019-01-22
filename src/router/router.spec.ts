import test from 'ava';
import { MessageRoute, Router } from './router';
import { Bot } from '..';
import * as Commands from '../commands';

var router: Router;
var bot: Bot = new Bot()

test('Utils:Router', t => {
  router = new Router([
    {
      type: 'message',
      commandTarget: 'argument',
      controller: Commands.Duration.setDurationTime,
      example: '{{prefix}}duration @user#0000 time 10',
      help: 'duration',
      name: 'duration-set-time',
      validate: '/command:string/user=user/action/time=number'
    },
    {
      type: 'message',
      commandTarget: 'author',
      controller: Commands.ChastiKey.Ticker.setTickerType,
      example: '{{prefix}}ck ticker set type 2',
      help: 'ck',
      name: 'ticker-set-type',
      validate: '/command:string/subroute:string/action:string/action2:string/type=number'
    }
  ], bot)

  t.pass()
})

test('Utils:Router:Route => Generate Route', t => {
  const r = new MessageRoute({
    type: 'message',
    commandTarget: 'author',
    controller: Commands.ChastiKey.Ticker.setTickerType,
    example: '{{prefix}}ck ticker set type 2',
    help: 'ck',
    name: 'ticker-set-type',
    validate: '/command:string/subroute:string/action:string/action2:string/type=number'
  })

  t.pass()
})

