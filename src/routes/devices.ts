import { RouteConfiguration } from '../utils/router';
import * as Commands from '../controllers/commands';

export const Routes: Array<RouteConfiguration> = [
  {
    commandTarget: 'none',
    controller: Commands.devicesConnectedCount,
    example: '!devices',
    name: 'devices-connected',
    validate: '/devices:string/connected:string'
  },

]