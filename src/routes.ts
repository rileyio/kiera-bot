import { Routes as AdminRoutes } from './routes/admin';
import { Routes as CKRoutes } from './routes/chastikey';
import { Routes as DecisionRoutes } from './routes/decision';
import { Routes as DeviceRoutes } from './routes/devices';
import { Routes as DurationRoutes } from './routes/duration';
import { Routes as HelpRoutes } from './routes/help';
import { Routes as LimitRoutes } from './routes/limit';
import { Routes as ReactRoutes } from './routes/react';
import { Routes as SessionRoutes } from './routes/session';
import { Routes as UserRoutes } from './routes/user';

export function Routes() {
  return Array().concat(
    AdminRoutes,
    CKRoutes,
    DecisionRoutes,
    DeviceRoutes,
    DurationRoutes,
    HelpRoutes,
    LimitRoutes,
    ReactRoutes,
    SessionRoutes,
    UserRoutes
  )
}
