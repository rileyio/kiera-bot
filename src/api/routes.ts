import { WebRoute } from './web-router'
import * as WebController from './controllers'
import * as Middleware from './middleware/web-middleware'

export const routes: Array<WebRoute> = [
  /*
   * Audit
   */
  {
    controller: WebController.Audit.getEntries,
    method: 'post',
    name: 'audit-log',
    path: '/api/audit',
    middleware: [Middleware.isAuthenticated]
  },
  /*
   * Available
   */
  {
    controller: WebController.Available.notifications,
    method: 'post',
    name: 'available-notifications',
    path: '/api/available/notifications',
    middleware: [Middleware.isAuthenticated]
  },
  {
    controller: WebController.Available.settings,
    method: 'post',
    name: 'available-settings',
    path: '/api/available/settings',
    middleware: [Middleware.isAuthenticated]
  },
  {
    controller: WebController.Available.userGeneric,
    method: 'post',
    name: 'available-user',
    path: '/api/available/user',
    middleware: [Middleware.isAuthenticated]
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
    middleware: [Middleware.isAuthenticated]
  },
  {
    controller: WebController.Notifications.updateNotification,
    method: 'post',
    name: 'notifications-update',
    path: '/api/notification/update',
    middleware: [Middleware.isAuthenticated]
  },
  /*
   * Permissions
   */
  {
    controller: WebController.Permissions.getAll,
    method: 'post',
    name: 'permissions-get-all',
    path: '/api/permissions',
    middleware: [Middleware.isAuthenticatedOwner]
  },
  {
    controller: WebController.Permissions.updateGlobal,
    method: 'post',
    name: 'permission-update-global',
    path: '/api/permission/global/update',
    middleware: [Middleware.isAuthenticatedOwner]
  },
  {
    controller: WebController.Permissions.deleteGlobal,
    method: 'delete',
    name: 'permission-delete-global',
    path: '/api/permission/global/delete',
    middleware: [Middleware.isAuthenticatedOwner]
  },
  {
    controller: WebController.Permissions.updateAllowed,
    method: 'post',
    name: 'permission-update-allowed',
    path: '/api/permission/allowed/update',
    middleware: [Middleware.isAuthenticatedOwner]
  },
  /*
   * Server Settings
   */
  {
    controller: WebController.Server.settings,
    method: 'post',
    name: 'server-get-settings',
    path: '/api/server/settings',
    middleware: [Middleware.isAuthenticatedOwner]
  },
  {
    controller: WebController.Server.updateSettings,
    method: 'post',
    name: 'server-update-setting',
    path: '/api/server/setting/update',
    middleware: [Middleware.isAuthenticatedOwner]
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
    middleware: [Middleware.isAuthenticated]
  },
  {
    controller: WebController.User.oauth,
    method: 'post',
    name: 'user-oauth',
    path: '/api/oauth',
    middleware: [Middleware.validAuthKey]
  },
  {
    controller: WebController.User.update,
    method: 'post',
    name: 'user-update',
    path: '/api/user/update',
    middleware: [Middleware.isAuthenticated]
  },
  /*
   * Kiera + CK Specific
   */
  {
    controller: WebController.ChastiKey.authTest,
    method: 'post',
    name: 'ck-3rd-auth-test',
    path: '/api/ck/auth'
  },
  // * Kiera+CK Keyholder * //
  {
    controller: WebController.ChastiKey.khData,
    method: 'get',
    name: 'ck-3rd-kh-view',
    path: '/api/ck/keyholder',
    middleware: [Middleware.validCKAuth]
  },
  // * Kiera+CK Lockee * //
  {
    controller: WebController.ChastiKey.lockeeData,
    method: 'get',
    name: 'ck-3rd-lockee-view',
    path: '/api/ck/lockee',
    middleware: [Middleware.validCKAuth]
  },
  // * Kiera+CK Stats * //
  {
    controller: WebController.ChastiKeyWebStats.locks,
    method: 'get',
    name: 'ck-stats-locks',
    path: '/api/ck/stats/locks'
  },
  /*
   * Decisions
   */
  {
    controller: WebController.Decisions.getDecisions,
    method: 'get',
    name: 'web-decision-as-owner',
    path: '/api/decisions',
    middleware: [Middleware.validCKAuth]
  },
  {
    controller: WebController.Decisions.updateDecisionName,
    method: 'patch',
    name: 'web-decision-update-name',
    path: '/api/decision/name',
    middleware: [Middleware.validCKAuth]
  },
  {
    controller: WebController.Decisions.enableDecision,
    method: 'patch',
    name: 'web-decision-update-enabled',
    path: '/api/decision/enabled',
    middleware: [Middleware.validCKAuth]
  },
  {
    controller: WebController.Decisions.addDecisionOutcome,
    method: 'put',
    name: 'web-decision-new-outcome',
    path: '/api/decision/outcome',
    middleware: [Middleware.validCKAuth]
  },
  {
    controller: WebController.Decisions.updateDecisionOutcome,
    method: 'patch',
    name: 'web-decision-update-outcome',
    path: '/api/decision/outcome',
    middleware: [Middleware.validCKAuth]
  },
  {
    controller: WebController.Decisions.deleteDecisionOutcome,
    method: 'delete',
    name: 'web-decision-new-outcome',
    path: '/api/decision/outcome',
    middleware: [Middleware.validCKAuth]
  },
  {
    controller: WebController.Decisions.addDecision,
    method: 'put',
    name: 'web-decision-new',
    path: '/api/decision',
    middleware: [Middleware.validCKAuth]
  },
  {
    controller: WebController.Decisions.deleteDecision,
    method: 'delete',
    name: 'web-decision-delete',
    path: '/api/decision',
    middleware: [Middleware.validCKAuth]
  }
]
