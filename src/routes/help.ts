import { RouteConfiguration } from '../utils/router';
import * as Commands from '../controllers/commands';

export const Routes: Array<RouteConfiguration> = [
  {
    commandTarget: 'author',
    controller: Commands.commandHelp,
    example: '!help ck',
    name: 'help-command',
    validate: '/help:string/command=string'
  },
  {
    commandTarget: 'author',
    controller: Commands.genericFallback,
    example: '!help',
    name: 'help',
    validate: '/help:string'
  },
]