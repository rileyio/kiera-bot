import { RouteConfiguration } from '../../utils/router';
import * as Commands from '../../commands';
import * as Middleware from '../../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'argument',
    controller: Commands.Admin.Statistics.getBotStats,
    example: '!admin stats',
    name: 'admin-stats',
    validate: '/admin:string/stats:string',
    middleware: [
      Middleware.hasRole('developer')
    ]
  }
]