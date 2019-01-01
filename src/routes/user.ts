import { RouteConfiguration } from '../utils/router';
import * as Commands from '../commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    commandTarget: 'author',
    controller: Commands.User.registerUser,
    example: '!register',
    name: 'register',
    validate: '/register:string',
    middleware: [
      Middleware.middlewareTest
    ]
  },
]