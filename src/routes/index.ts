import { Routes as AdminRoutes } from './admin';
import { Routes as CKRoutes } from './chastikey';
import { Routes as DecisionRoutes } from './decision';
import { Routes as DurationRoutes } from './duration';
import { Routes as HelpRoutes } from './help';
import { Routes as LimitRoutes } from './limit';
import { Routes as ReactRoutes } from './react';
import { Routes as SessionRoutes } from './session';
import { Routes as UserRoutes } from './user';

export function Routes() {
  return Array().concat(
    AdminRoutes,
    CKRoutes,
    DecisionRoutes,
    DurationRoutes,
    HelpRoutes,
    LimitRoutes,
    ReactRoutes,
    SessionRoutes,
    UserRoutes
  )
}
