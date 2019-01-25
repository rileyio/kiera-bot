import { RouteConfiguration } from '../router/router';

// Import routes from ./*/ to keep this file cleaner
import { Routes as AdminUserRoutes } from './admin/admin-user';
import { Routes as AdminChannelRoutes } from './admin/admin-channel';
import { Routes as AdminServerlRoutes } from './admin/admin-server';
import { Routes as AdminServerStats } from './admin/admin-stats';

export const Routes: Array<RouteConfiguration> = Array().concat(
  AdminUserRoutes,
  AdminChannelRoutes,
  AdminServerlRoutes,
  AdminServerStats,
  [])