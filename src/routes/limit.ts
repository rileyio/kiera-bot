import { RouteConfiguration } from '../utils/router';
import * as Commands from '../commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'argument',
    controller: Commands.Limit.setUserSessionTimeLimit,
    example: '!limit session time 10',
    name: 'limit-set-session-limits',
    validate: '/limit:string/session:string/key=string/value=number',
    middleware: [
      Middleware.hasRole(['lockee', 'developer'])
    ]
  },
]