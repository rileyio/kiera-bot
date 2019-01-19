import { RouteConfiguration } from '../utils/router';
import * as Commands from '../commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.User.registerUser,
    example: '{{prefix}}register',
    name: 'register',
    validate: '/register:string',
    middleware: [
      Middleware.middlewareTest
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.User.registerAPIAuthKey,
    example: '{{prefix}}user key new',
    name: 'user-api-authkey-create',
    validate: '/user:string/key:string/new:string',
    middleware: [
      Middleware.isUserRegistered
    ]
  },
  {
    type: 'message',
    commandTarget: 'author',
    controller: Commands.User.destroyAPIAuthKey,
    example: '{{prefix}}user key destroy user:1:123abc',
    name: 'user-api-authkey-destroy',
    validate: '/user:string/key:string/destroy:string/authkey=string',
    middleware: [
      Middleware.isUserRegistered
    ]
  }
]