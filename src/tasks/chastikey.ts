import * as APIUrls from '@/api-urls'
import { Collections } from '@/db'
import { ChastiKeyAPIFetchAndStore, ChastiKeyAPIFetchAndStoreMethod, ChastiKeyAPIFetchAndStoreArray } from '@/tasks/templates/ck-api-fetch-store'
import { ChastiKeyVerifiedRoleMonitor } from '@/tasks/templates/ck-verified-monitor'
import { ChastiKeyAPIFetchAndStoreLegacy } from './templates/ck-api-fetch-store-legacy'
import { ChastiKeyGenerateStats } from './templates/ck-generate-stats'
// import { ChastiKeyEventRoleMonitor } from '@/tasks/templates/ck-locktober-monitor'

export class ChastiKeyAPIRunningLocks extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPIRunningLocks'
  method: ChastiKeyAPIFetchAndStoreMethod = 'fetchAPIRunningLocksDataCache'
  dbCollection: Collections = 'ck-running-locks'
  respArray: ChastiKeyAPIFetchAndStoreArray = 'locks'
}

export class ChastiKeyAPIUsers extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPIUsers'
  method: ChastiKeyAPIFetchAndStoreMethod = 'fetchAPIUserDataCache'
  dbCollection: Collections = 'ck-users'
  respArray: ChastiKeyAPIFetchAndStoreArray = 'users'
}

export class ChastiKeyAPILocktober extends ChastiKeyAPIFetchAndStoreLegacy {
  // Setting the props for this Task
  name = 'ChastiKeyAPILocktober'
  APIEndpoint = APIUrls.ChastiKey.CachedLocktober
  dbCollection: Collections = 'ck-locktober'
}

export class ChastiKeyBackgroundVerifiedMonitor extends ChastiKeyVerifiedRoleMonitor {
  // Setting the props for this Task
  name = 'ChastiKeyBackgroundVerifiedMonitor'
  frequency = 1800000 / 30 // 1 minute
  verifiedRole = 'ChastiKey Verified'
}

export class ChastiKeyGenerateStatsScheduled extends ChastiKeyGenerateStats {
  // Setting the props for this Task
  name = 'ChastiKeyGenerateStatsScheduled'
}

// export class ChastiKeyBackgroundLocktoberMonitor extends ChastiKeyEventRoleMonitor {
//   // Setting the props for this Task
//   name = 'ChastiKeyBackgroundLocktoberMonitor'
//   frequency = 1800000 / 2 // 15 minutes
//   dbCollection: Collections = 'ck-locktober'
//   eventRole = 'Locktober 2019'
// }
