import { RouteConfiguration } from '../utils/router';
import * as Commands from '../controllers/commands';

export const Routes: Array<RouteConfiguration> = [
  {
    controller: Commands.commandHelp,
    example: '!help ck',
    name: 'help-command',
    validate: '/help:string/command=string'
  },
  {
    controller: Commands.genericFallback,
    example: '!help',
    name: 'help',
    validate: '/help:string'
  },
]