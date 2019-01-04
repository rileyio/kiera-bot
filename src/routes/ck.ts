import { RouteConfiguration } from '../utils/router';
import * as Commands from '../commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.ChastiKey.setUsername,
    example: '!ck username MyUsername',
    name: 'ck-set-username',
    validate: '/ck:string/username:string/ckusername=string',
    middleware: [
      Middleware.isUserRegistered
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.ChastiKey.Ticker.setTickerType,
    example: '!ck ticker set type 2',
    name: 'ck-set-tickerType',
    validate: '/ck:string/ticker:string/set:string/type:string/number=number',
    middleware: [
      Middleware.middlewareTest
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.ChastiKey.Ticker.getTicker,
    example: '!ck ticker',
    name: 'ck-get-ticker',
    validate: '/ck:string/ticker:string',
    middleware: [
      Middleware.middlewareTest
    ]
  },
]