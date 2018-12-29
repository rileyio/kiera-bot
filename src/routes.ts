import { Routes as AdminRoutes } from './routes/admin';
import { Routes as CKRoutes } from './routes/ck';
import { Routes as DeviceRoutes } from './routes/devices';
import { Routes as DurationRoutes } from './routes/duration';
import { Routes as HelpRoutes } from './routes/help';
import { Routes as ReactRoutes } from './routes/react';
import { Routes as SessionRoutes } from './routes/session';
import { Routes as UserRoutes } from './routes/user';

export function Routes() {
  const routes = Array().concat(
    HelpRoutes, UserRoutes, DeviceRoutes, CKRoutes,
    AdminRoutes, DurationRoutes, ReactRoutes, SessionRoutes
  )
  return routes
}