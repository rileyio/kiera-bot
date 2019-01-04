import { RouteConfiguration } from '../utils/router';
import * as Commands from '../commands';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.Help.commandHelp,
    example: '!help ck',
    name: 'help-command',
    validate: '/help:string/command=string'
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.Help.genericFallback,
    example: '!help',
    name: 'help',
    validate: '/help:string'
  },
]