import { RouteConfiguration } from '../utils/router';
import * as Commands from '../commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'controller-decision',
    controller: Commands.Session.createNewSession,
    example: '!session',
    name: 'session-new',
    validate: '/session:string/new:string/type=string',
    middleware: [
      Middleware.isUserRegistered,
      Middleware.hasRole(['developer', 'keyholder', 'lockee'])
    ]
  },
  {
    type: 'message',
    commandTarget: 'controller-decision',
    controller: Commands.Session.activateSession,
    example: '!session',
    name: 'session-activate',
    validate: '/session:string/activate:string/id=string',
    middleware: [
      Middleware.isUserRegistered,
      Middleware.hasRole(['developer', 'keyholder', 'lockee'])
    ]
  },
  {
    type: 'message',
    commandTarget: 'controller-decision',
    controller: Commands.Session.deactivateSession,
    example: '!session',
    name: 'session-deactivate',
    validate: '/session:string/deactivate:string/id=string',
    middleware: [
      Middleware.isUserRegistered,
      Middleware.hasRole(['developer', 'keyholder', 'lockee'])
    ]
  },
  {
    type: 'reaction',
    commandTarget: 'controller-decision',
    controller: Commands.Session.handleReact,
    name: 'session-active-react',
    middleware: [
      Middleware.isUserRegistered,
      Middleware.hasRole(['developer', 'keyholder', 'lockee'])
    ]
  },
]