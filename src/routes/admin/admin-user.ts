import { RouteConfiguration } from '../../utils/router';
import * as Commands from '../../commands';
import * as Middleware from '../../middleware';

export const Routes: Array<RouteConfiguration> = [
  /////// User DB Detele
  {
    type: 'message',
    commandTarget: 'argument',
    controller: Commands.Admin.User.removeUser,
    example: '!admin user delete @user#0000',
    name: 'admin-user-delete',
    validate: '/admin:string/user:string/delete:string/user=user',
    middleware: [
      Middleware.hasRole('developer')
    ]
  },
]