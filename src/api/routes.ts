import { WebRoute } from './web-router';
import * as WebController from './controllers';
import * as Middleware from './middleware/web-middleware';

export const routes: Array<WebRoute> = [
  /*
   * Audit
   */
  {
    controller: WebController.Audit.getEntries,
    method: 'post',
    name: 'audit-log',
    path: '/api/audit',
    middleware: [
      Middleware.isAuthenticated
    ]
  },  
  /*
   * Available
   */
  {
    controller: WebController.Available.notifications,
    method: 'post',
    name: 'available-notifications',
    path: '/api/available/notifications',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
  {
    controller: WebController.Available.settings,
    method: 'post',
    name: 'available-settings',
    path: '/api/available/settings',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
  {
    controller: WebController.Available.userGeneric,
    method: 'post',
    name: 'available-user',
    path: '/api/available/user',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
  /*
   * Decisions
   */
  {
    controller: WebController.Decisions.getDecisions,
    method: 'post',
    name: 'decisions-get-all',
    path: '/api/decisions',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
  {
    controller: WebController.Decisions.deleteOne,
    method: 'delete',
    name: 'decision-delete',
    path: '/api/decision/delete',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
  {
    controller: WebController.Decisions.decisionOutcomeUpdate,
    method: 'post',
    name: 'decision-outcome-update',
    path: '/api/decision/outcome/update',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
  {
    controller: WebController.Decisions.deleteDecisionOutcome,
    method: 'delete',
    name: 'decision-outcome-delete',
    path: '/api/decision/outcome/delete',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
  {
    controller: WebController.Decisions.addDecisionOutcome,
    method: 'post',
    name: 'decision-outcome-add',
    path: '/api/decision/outcome/add',
    middleware: [
      Middleware.isAuthenticated
    ]
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
   * Notifications
   */
  {
    controller: WebController.Notifications.getNotifications,
    method: 'post',
    name: 'notifications-get',
    path: '/api/notifications',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
  {
    controller: WebController.Notifications.updateNotification,
    method: 'post',
    name: 'notifications-update',
    path: '/api/notification/update',
    middleware: [
      Middleware.isAuthenticated
    ]
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
      Middleware.isAuthenticatedOwner
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
    controller: WebController.Permissions.deleteGlobal,
    method: 'delete',
    name: 'permission-delete-global',
    path: '/api/permission/global/delete',
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
   * Server Settings
   */
  {
    controller: WebController.Server.settings,
    method: 'post',
    name: 'server-get-settings',
    path: '/api/server/settings',
    middleware: [
      Middleware.isAuthenticatedOwner
    ]
  },
  {
    controller: WebController.Server.updateSettings,
    method: 'post',
    name: 'server-update-setting',
    path: '/api/server/setting/update',
    middleware: [
      Middleware.isAuthenticatedOwner
    ]
  },
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
  {
    controller: WebController.User.update,
    method: 'post',
    name: 'user-update',
    path: '/api/user/update',
    middleware: [
      Middleware.isAuthenticated
    ]
  },
]