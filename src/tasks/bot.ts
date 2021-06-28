import { DBAgeCleanup } from './templates/db-age-cleanup'
import { StatusMessageRotator } from './templates/status-message-rotator'

export class StatusMessageRotatorScheduled extends StatusMessageRotator {
  // Setting the props for this Task
  name = 'StatusMessageRotatorScheduled'
}

export class DBAgeCleanupScheduled extends DBAgeCleanup {
  // Setting the props for this Task
  name = 'DBAgeCleanupScheduled'
}
