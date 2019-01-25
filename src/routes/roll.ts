import { RouteConfiguration } from '../router/router';
import * as Commands from '../commands';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'argument',
    controller: Commands.Roll.roll,
    example: '{{prefix}}roll',
    name: 'roll-die',
    validate: '/roll:string/count1?=number/count2?=number'
  },
]