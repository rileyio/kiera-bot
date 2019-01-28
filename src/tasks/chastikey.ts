import { Collections } from '../db/database';
import { ChastiKeyAPIFetchAndStore } from './templates/ck-api-fetch-store';

export class ChastiKeyAPIRunningLocks extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPIRunningLocks'
  APIEndpoint = `https://chastikey.com/json/v1.0/kiera_running_locks.json`
  frequency = 3600000 // 30 minutes (this is the refresh rate of this data)
  dbCollection: Collections = 'ck-running-locks'
}

export class ChastiKeyAPIKeyholders extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPIKeyholders'
  APIEndpoint = `https://chastikey.com/json/v1.0/kiera_keyholders_data.json`
  frequency = 3600000 // 30 minutes (this is the refresh rate of this data)
  dbCollection: Collections = 'ck-keyholders'
}

export class ChastiKeyAPILockees extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPILockees'
  APIEndpoint = `https://chastikey.com/json/v1.0/kiera_lockees_data.json`
  frequency = 3600000 // 30 minutes
  dbCollection: Collections = 'ck-lockees'
}

export class ChastiKeyAPITotalLockedTime extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPITotalLockedTime'
  APIEndpoint = `https://www.chastikey.com/json/v1.0/kiera_total_lock_times.json`
  frequency = (3600000 * 2) // 60 minutes
  dbCollection: Collections = 'ck-lockee-totals'
}
