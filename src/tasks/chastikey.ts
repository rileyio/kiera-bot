import * as APIUrls from '@/api-urls'

import { ChastiKeyAPIFetchAndStore, ChastiKeyAPIFetchAndStoreArray, ChastiKeyAPIFetchAndStoreMethod } from '@/tasks/templates/ck-api-fetch-store'

import { ChastiKeyAPIFetchAndStoreLegacy } from './templates/ck-api-fetch-store-legacy'
import { ChastiKeyGenerateStats } from './templates/ck-generate-stats'
import { ChastiKeyVerifiedRoleMonitor } from '@/tasks/templates/ck-verified-monitor'
import { Collections } from '@/db'
// import { ChastiKeyEventRoleMonitor } from '@/tasks/templates/ck-locktober-monitor'

export class ChastiKeyAPIRunningLocks extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPIRunningLocks'
  method: ChastiKeyAPIFetchAndStoreMethod = 'fetchAPIRunningLocksDataCache'
  dbCollection: keyof Collections = 'ck-running-locks'
  respArray: ChastiKeyAPIFetchAndStoreArray = 'locks'
}

export class ChastiKeyAPIUsers extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPIUsers'
  method: ChastiKeyAPIFetchAndStoreMethod = 'fetchAPIUserDataCache'
  dbCollection: keyof Collections = 'ck-users'
  respArray: ChastiKeyAPIFetchAndStoreArray = 'users'
}

export class ChastiKeyAPILocktober2019 extends ChastiKeyAPIFetchAndStoreLegacy {
  // Setting the props for this Task
  name = 'ChastiKeyAPILocktober2019'
  APIEndpoint = APIUrls.ChastiKey.CachedLocktober2019
  dbCollection: keyof Collections = 'ck-locktober-2019'
}

export class ChastiKeyAPILocktober2020 extends ChastiKeyAPIFetchAndStoreLegacy {
  // Setting the props for this Task
  name = 'ChastiKeyAPILocktober2020'
  APIEndpoint = APIUrls.ChastiKey.CachedLocktober2020
  dbCollection: keyof Collections = 'ck-locktober-2020'
}

export class ChastiKeyAPILocktober2021 extends ChastiKeyAPIFetchAndStoreLegacy {
  // Setting the props for this Task
  name = 'ChastiKeyAPILocktober2021'
  APIEndpoint = APIUrls.ChastiKey.CachedLocktober2021
  dbCollection: keyof Collections = 'ck-locktober-2021'
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
//   dbCollection: keyof Collections = 'ck-locktober'
//   eventRole = 'Locktober 2019'
// }
