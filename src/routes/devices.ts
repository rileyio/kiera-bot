import { RouteConfiguration } from '../utils/router';
import * as Commands from '../incoming/commands';

export const Routes: Array<RouteConfiguration> = [
  {
    controller: Commands.devicesConnectedCount,
    example: '!devices',
    name: 'devices-connected',
    validate: '/devices:string/connected:string'
  },

]