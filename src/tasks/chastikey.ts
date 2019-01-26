import { Collections } from '../db/database';
import { ChastiKeyAPIFetchAndStore } from './templates/ck-api-fetch-store';

export class ChastiKeyAPIRunningLocks extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPIRunningLocks'
  APIEndpoint = `https://chastikey.com/json/v1.0/running_locks.json`
  frequency = 3600000 // 30 minutes (this is the refresh rate of this data)
  dbCollection: Collections = 'ck-running-locks'
}

export class ChastiKeyAPIKeyholderRatings extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPIKeyholderRatings'
  APIEndpoint = `https://chastikey.com/json/v1.0/keyholders_rating.json`
  frequency = 3600000 // 30 minutes (this is the refresh rate of this data)
  dbCollection: Collections = 'ck-keyholder-raitings'
}

export class ChastiKeyAPITotalLockedTime extends ChastiKeyAPIFetchAndStore {
  // Setting the props for this Task
  name = 'ChastiKeyAPITotalLockedTime'
  APIEndpoint = `https://chastikey.com/json/v1.0/total_lock_times.json`
  frequency = (3600000 * 2) // 60 minutes
  dbCollection: Collections = 'ck-total-locked-time'
  isJSON = false
  strip = `tabledata = `
}
