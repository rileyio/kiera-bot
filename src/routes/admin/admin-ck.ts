import { RouteConfiguration } from '../../router/router';
import * as Commands from '../../commands';
import * as Middleware from '../../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'argument',
    controller: Commands.Admin.CK.forceStatsReload,
    example: '{{prefix}}admin ck stats refresh',
    name: 'admin-ck-stats-stats',
    restricted: true,
    validate: '/admin:string/ck:string/stats:string/refresh:string',
    middleware: [
      Middleware.hasRole('developer')
    ]
  }
]