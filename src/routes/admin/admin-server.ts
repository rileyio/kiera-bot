import { RouteConfiguration } from '../../utils/router';
import * as Commands from '../../commands';
import * as Middleware from '../../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'none',
    controller: Commands.Admin.Server.versionCheck,
    example: '!version',
    name: 'admin-version',
    validate: '/version:string',
    middleware: [
      Middleware.hasRole(['tester', 'developer'])
    ]
  },
  /////// Ping Pong Test
  {
    type: 'message',
    commandTarget: 'none',
    controller: Commands.Admin.Server.pingPong,
    example: '!ping',
    name: 'admin-ping',
    validate: '/ping:string',
    middleware: [
      Middleware.hasRole(['tester', 'developer'])
    ]
  }
]