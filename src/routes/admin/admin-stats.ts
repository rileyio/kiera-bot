import { RouteConfiguration } from '../../router/router';
import * as Commands from '../../commands';
import * as Middleware from '../../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'argument',
    controller: Commands.Admin.Statistics.getBotStats,
    example: '{{prefix}}admin stats',
    name: 'admin-stats',
    restricted: true,
    validate: '/admin:string/stats:string',
    middleware: [
      Middleware.hasRole('developer')
    ]
  }
]