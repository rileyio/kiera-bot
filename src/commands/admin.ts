// Export sub controllers to keep this file clean
import * as AdminUser from './admin/admin-user';
import * as AdminChannel from './admin/admin-channel';
import * as AdminCK from './admin/admin-ck';
import * as AdminServer from './admin/admin-server';
import * as AdminStats from './admin/admin-stats';

export namespace Admin {
  export const Channel = AdminChannel
  export const CK = AdminCK
  export const Server = AdminServer
  export const Statistics = AdminStats
  export const User = AdminUser
}
