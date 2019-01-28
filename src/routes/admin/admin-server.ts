import { RouteConfiguration } from '../../router/router';
import * as Commands from '../../commands';
import * as Middleware from '../../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'none',
    controller: Commands.Admin.Server.versionCheck,
    example: '{{prefix}}version',
    name: 'admin-version',
    validate: '/version:string',
  },
  {
    type: 'message',
    commandTarget: 'none',
    controller: Commands.Admin.Server.pingPong,
    example: '{{prefix}}ping',
    name: 'admin-ping',
    validate: '/ping:string'
  },
  {
    type: 'message',
    commandTarget: 'none',
    controller: Commands.Admin.Server.forceRestart,
    example: '{{prefix}}restart bot',
    name: 'admin-restart-bot',
    restricted: true,
    validate: '/admin:string/restart:string/bot:string/seconds?=number',
    middleware: [
      Middleware.hasRole('developer')
    ]
  }
]