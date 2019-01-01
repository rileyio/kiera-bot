import { RouteConfiguration } from '../utils/router';
import * as Commands from '../commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    commandTarget: 'argument',
    controller: Commands.React.setReactTime,
    example: '!react',
    name: 'react-set-time',
    validate: '/react:string/user=user/time:string/newtime=number',
    middleware: [
      Middleware.middlewareTest,
      Middleware.hasRole(['developer', 'keyholder'])
    ]
  },
]