import { WebRoute } from './web-router';
import * as WebController from './controllers';

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
    path: '/api/permissions'
  },
  {
    controller: WebController.Permissions.get,
    method: 'post',
    name: 'permissions-get',
    path: '/api/permission'
  },
  /*
   * Sessions
   */
  {
    controller: WebController.Sessions.getAll,
    method: 'post',
    name: 'sessions-get-all',
    path: '/api/sessions'
  },
  {
    controller: WebController.Sessions.get,
    method: 'post',
    name: 'session-get',
    path: '/api/session'
  },
  /*
   * User
   */
  {
    controller: WebController.User.get,
    method: 'post',
    name: 'user-get',
    path: '/api/user'
  },
  {
    controller: WebController.User.oauth,
    method: 'post',
    name: 'user-oauth',
    path: '/api/oauth'
  },
]