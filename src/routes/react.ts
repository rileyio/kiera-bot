import { RouteConfiguration } from '../router/router';
import * as Commands from '../commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'argument',
    controller: Commands.React.setReactTime,
    example: '{{prefix}}react',
    name: 'react-set-time',
    validate: '/react:string/user=user/time:string/newtime=number',
    middleware: [
      Middleware.middlewareTest,
      Middleware.hasRole(['developer', 'keyholder'])
    ]
  },
]