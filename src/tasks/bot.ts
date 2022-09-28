import { DBAgeCleanup } from './templates/db-age-cleanup'
import { ManagedUpdate } from './templates/managed-update'
import { StatusMessageRotator } from './templates/status-message-rotator'

export class DBAgeCleanupScheduled extends DBAgeCleanup {
  // Setting the props for this Task
  name = 'DBAgeCleanupScheduled'
}

export class ManagedUpdateScheduled extends ManagedUpdate {
  // Setting the props for this Task
  name = 'ManagedUpdateScheduled'
}

export class StatusMessageRotatorScheduled extends StatusMessageRotator {
  // Setting the props for this Task
  name = 'StatusMessageRotatorScheduled'
}
