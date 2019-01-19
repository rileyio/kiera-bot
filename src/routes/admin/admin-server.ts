import { RouteConfiguration } from '../../utils/router';
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
  /////// Ping Pong Test
  {
    type: 'message',
    commandTarget: 'none',
    controller: Commands.Admin.Server.pingPong,
    example: '{{prefix}}ping',
    name: 'admin-ping',
    validate: '/ping:string'
  }
]