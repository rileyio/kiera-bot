import { WebRoute } from './web-router';
import * as WebController from './controllers';
import * as Middleware from './middleware/web-middleware';

export const routes: Array<WebRoute> = [
  /*
   * Stats
   */
  {
    controller: WebController.Stats.getAll,
    method: 'get',
    name: 'stats-get-all',
    path: '/api/stats'
  },
  /*
   * Lists
   */
  {
    controller: WebController.Lists.get,
    method: 'post',
    name: 'lists-get',
    path: '/api/lists'
  },
  /*
   * Permissions
   */
  {
    controller: WebController.Permissions.getAll,
    method: 'post',
    name: 'permissions-get-all',
    path: '/api/permissions',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
  {
    controller: WebController.Permissions.updateGlobal,
    method: 'post',
    name: 'permission-update-global',
    path: '/api/permission/global/update',
    middleware: [
      Middleware.isAuthenticatedOwner
    ]
  },
  {
    controller: WebController.Permissions.updateAllowed,
    method: 'post',
    name: 'permission-update-allowed',
    path: '/api/permission/allowed/update',
    middleware: [
      Middleware.isAuthenticatedOwner
    ]
  },
  // {
  //   controller: WebController.Permissions.get,
  //   method: 'post',
  //   name: 'permissions-get',
  //   path: '/api/permission',
  // },
  /*
   * Sessions
   */
  {
    controller: WebController.Sessions.getAll,
    method: 'post',
    name: 'sessions-get-all',
    path: '/api/sessions',
    middleware: [
      Middleware.validAuthKey
    ]
  },
  {
    controller: WebController.Sessions.get,
    method: 'post',
    name: 'session-get',
    path: '/api/session',
    middleware: [
      Middleware.validAuthKey
    ]
  },
  /*
   * User
   */
  {
    controller: WebController.User.get,
    method: 'post',
    name: 'user-get',
    path: '/api/user',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
  {
    controller: WebController.User.oauth,
    method: 'post',
    name: 'user-oauth',
    path: '/api/oauth',
    middleware: [
      Middleware.validAuthKey
    ]
  },
]