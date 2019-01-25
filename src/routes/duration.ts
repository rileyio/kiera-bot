import { RouteConfiguration } from '../router/router';
import * as Commands from '../commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'argument',
    controller: Commands.Duration.setDurationTime,
    example: '{{prefix}}duration @user#0000 time 10',
    name: 'duration-set-time',
    validate: '/duration:string/user=user/key=string/value=number',
    middleware: [
      Middleware.hasRole(['keyholder', 'developer'])
    ]
  },
]