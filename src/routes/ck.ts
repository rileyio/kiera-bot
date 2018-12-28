import { RouteConfiguration } from '../utils/router';
import * as Commands from '../controllers/commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    commandTarget: 'author',
    controller: Commands.setUsername,
    example: '!ck username MyUsername',
    name: 'ck-set-username',
    validate: '/ck:string/username:string/ckusername=string',
    middleware: [
      Middleware.isUserRegistered
    ]
  },
  {
    commandTarget: 'author',
    controller: Commands.setTickerType,
    example: '!ck ticker set type 2',
    name: 'ck-set-tickerType',
    validate: '/ck:string/ticker:string/set:string/type:string/number=number',
    middleware: [
      Middleware.middlewareTest
    ]
  },
  {
    commandTarget: 'author',
    controller: Commands.getTicker,
    example: '!ck ticker',
    name: 'ck-get-ticker',
    validate: '/ck:string/ticker:string',
    middleware: [
      Middleware.middlewareTest
    ]
  },
]