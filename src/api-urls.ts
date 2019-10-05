namespace ChastiKey {
  /**
   * **Fetches past unlocked combinations**
   * 
   * Update Frequency: `Upon request`
   * 
   * Request Type: `GET`
   */
  export const Combinations: string = `https://chastikey.com/api/kiera/combinations.php`
  /**
   * **Used to initiate Discord verification process**
   * 
   * Update Frequency: `Upon request`
   * 
   * Request Type: `POST`
   */
  export const DiscordAuth: string = `https://chastikey.com/api/kiera/discordbotqrauthenticator.php`
  /**
   * **Used to spot check verify user & retrieve a username from a verified Discord ID**
   * 
   * Update Frequency: `Upon request`
   * 
   * Request Type: `GET`
   */
  export const VerifyDiscordID = `https://chastikey.com/api/kiera/verifycheck.php`
  /**
   * **List all locks for a particular user, locked or unlocked, deleted or non-deleted**
   * 
   * Update Frequency: `Upon request`
   * 
   * Request Type: `GET`
   */
  export const ListLocks: string = `https://chastikey.com/api/kiera/listlocks.php`
  /**
   * **Cached Dataset with Keyholder data**
   * 
   * Update Frequency: `15 minutes`
   * 
   * Request Type: `GET`
   */
  export const CachedKeyholderData: string = `https://chastikey.com/api/kiera/keyholders_data.json`
  /**
   * **Cached data of who's eligible for the Locktober role**
   * 
   * Update Frequency: `15 minutes`
   * 
   * Request Type: `GET`
   */
  export const CachedLocktober: string = `https://chastikey.com/api/kiera/locked_for_locktober.json`
  /**
   * **Cached Dataset with Lockee data**
   * 
   * Update Frequency: `15 minutes`
   * 
   * Request Type: `GET`
   */
  export const CachedLockeeData = `https://chastikey.com/api/kiera/lockees_data.json`
  /**
   * **Cached Dataset with Currently active locks**
   * 
   * Update Frequency: `15 minutes`
   * 
   * Request Type: `GET`
   */
  export const CachedRunningLocks = `https://chastikey.com/api/kiera/running_locks.json`
  /**
   * **Cached Dataset with ChastiKey user data**
   * 
   * Update Frequency: `15 minutes`
   * 
   * Request Type: `GET`
   */
  export const CachedCKUserData = `https://chastikey.com/api/kiera/user_data.json`
  /**
   * **Ticker**
   * 
   * Update Frequency: `Upon Request`
   * 
   * Request Type: `GET`
   */
  export const Ticker = `http://chastikey.com/tickers/ticker.php`
}

export {
  ChastiKey
}