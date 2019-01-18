import { RouteConfiguration } from '../utils/router';
import * as Commands from '../commands';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.Help.commandHelp,
    example: '{{prefix}}help ck',
    name: 'help-command',
    validate: '/help:string/command=string'
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.Help.genericFallback,
    example: '{{prefix}}help',
    name: 'help',
    validate: '/help:string'
  },
]