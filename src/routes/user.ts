import { RouteConfiguration } from '../utils/router';
import * as Commands from '../incoming/commands';
import * as Middleware from '../middleware';

export const Routes: Array<RouteConfiguration> = [
  {
    controller: Commands.registerUser,
    example: '!register',
    name: 'register',
    validate: '/register:string',
    middleware: [
      Middleware.middlewareTest
    ]
  },

]