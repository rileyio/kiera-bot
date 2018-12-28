import { RouteConfiguration } from '../utils/router';
import * as Commands from '../controllers/commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    commandTarget: 'argument',
    controller: Commands.setReactTime,
    example: '!react',
    name: 'react-set-time',
    validate: '/react:string/user=user/time:string/newtime=number',
    middleware: [
      Middleware.middlewareTest,
      Middleware.hasRole('keyholder')
    ]
  },
]