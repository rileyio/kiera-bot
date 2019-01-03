import { Routes as AdminRoutes } from './routes/admin';
import { Routes as CKRoutes } from './routes/ck';
import { Routes as DeviceRoutes } from './routes/devices';
import { Routes as DurationRoutes } from './routes/duration';
import { Routes as HelpRoutes } from './routes/help';
import { Routes as LimitRoutes } from './routes/limit';
import { Routes as ReactRoutes } from './routes/react';
import { Routes as SessionRoutes, Reactions as _ReactionRoutes } from './routes/session';
import { Routes as UserRoutes } from './routes/user';

export function Routes() {
  return Array().concat(
    HelpRoutes, UserRoutes, DeviceRoutes, CKRoutes,
    AdminRoutes, DurationRoutes, ReactRoutes, SessionRoutes,
    LimitRoutes
  )
}

export function ReactionRoutes() {
  return Array().concat(
    _ReactionRoutes
  )
}