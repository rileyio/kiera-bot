import { RouteConfiguration } from '../utils/router';
import * as Commands from '../controllers/commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    commandTarget: 'argument',
    controller: Commands.setDurationTime,
    example: '!duration @user#0000 time 10',
    name: 'duration-set-time',
    validate: '/duration:string/user=user/time:string/newtime=number',
    middleware: [
      Middleware.middlewareTest,
      Middleware.hasRole(['keyholder', 'developer'])
    ]
  },
]