import { RouteConfiguration } from '../router/router';
import * as Commands from '../commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.ChastiKey.setUsername,
    example: '{{prefix}}ck username "MyUsername"',
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
    example: '{{prefix}}ck ticker set type 2',
    name: 'ck-set-tickerType',
    validate: '/ck:string/ticker:string/set:string/type:string/number=number',
    middleware: [
      Middleware.isUserRegistered
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.ChastiKey.Ticker.getTicker,
    example: '{{prefix}}ck ticker',
    name: 'ck-get-ticker',
    validate: '/ck:string/ticker:string/type?=number',
    middleware: [
      Middleware.isUserRegistered
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.ChastiKey.Stats.getLockeeStats,
    example: '{{prefix}}ck stats lockee',
    name: 'ck-get-stats-lockee',
    validate: '/ck:string/stats:string/type?=string/user?=string',
    // middleware: [
    //   Middleware.isUserRegistered
    // ]
  },
]