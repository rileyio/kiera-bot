export interface ProcessedPermissions {
  // Permissions of user
  hasAdministrator: boolean
  hasManageChannel: boolean
  hasManageGuild: boolean
  // Checks
  outcome?: ProcessedPermissionOutcome
  // Bool state outcome
  pass?: boolean
}

export type ProcessedPermissionOutcome =
  | 'Pass'
  | 'FailedAdmin'
  | 'FailedIDCheck'
  | 'FailedManageGuild'
  | 'FailedPermissionsCheck'
  | 'FailedServerOnlyRestriction'
  | 'FailedManageChannel'

export type RouteActionUserTarget = 'none' | 'author' | 'argument' | 'controller-decision'
