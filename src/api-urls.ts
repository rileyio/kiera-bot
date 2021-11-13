export const ChastiKey = {
  /**
   * **Cached Dataset with ChastiKey user data**
   *
   * Update Frequency: `15 minutes`
   *
   * Request Type: `GET`
   */
  CachedCKUserData: `https://chastikey.com/api/kiera/user_data.json`,
  /**
   * **Cached Dataset with Keyholder data**
   *
   * Update Frequency: `15 minutes`
   *
   * Request Type: `GET`
   */
  CachedKeyholderData: `https://chastikey.com/api/kiera/keyholders_data.json`,
  /**
   * **Cached Dataset with Lockee data**
   *
   * Update Frequency: `15 minutes`
   *
   * Request Type: `GET`
   */
  CachedLockeeData: `https://chastikey.com/api/kiera/lockees_data.json`,
  /**
   * **Cached data of who's eligible for the Locktober role**
   *
   * Update Frequency: `15 minutes`
   *
   * Request Type: `GET`
   */
  CachedLocktober2019: `https://chastikey.com/api/kiera/locked_for_locktober.json`,
  CachedLocktober2020: `https://chastikey.com/api/kiera/locked_for_locktober_2020.json`,
  CachedLocktober2021: `https://chastikey.com/api/kiera/locked_for_locktober_2021.json`,
  /**
   * **Cached Dataset with Currently active locks**
   *
   * Update Frequency: `15 minutes`
   *
   * Request Type: `GET`
   */
  CachedRunningLocks: `https://chastikey.com/api/kiera/running_locks.json`,
  /**
   * **Fetches past unlocked combinations**
   *
   * Update Frequency: `Upon request`
   *
   * Request Type: `GET`
   */
  Combinations: `https://chastikey.com/api/kiera/combinations.php`,
  /**
   * **Used to initiate Discord verification process**
   *
   * Update Frequency: `Upon request`
   *
   * Request Type: `POST`
   */
  DiscordAuth: `https://chastikey.com/api/kiera/discordbotqrauthenticator.php`,
  /**
   * **List all locks for a particular user, locked or unlocked, deleted or non-deleted**
   *
   * Update Frequency: `Upon request`
   *
   * Request Type: `GET`
   */
  ListLocks: `https://chastikey.com/api/kiera/listlocks.php`,
  /**
   * **Ticker**
   *
   * Update Frequency: `Upon Request`
   *
   * Request Type: `GET`
   */
  Ticker: `http://chastikey.com/tickers/ticker.php`,
  /**
   * **Used to spot check verify user & retrieve a username from a verified Discord ID**
   *
   * Update Frequency: `Upon request`
   *
   * Request Type: `GET`
   */
  VerifyDiscordID: `https://chastikey.com/api/kiera/verifycheck.php`
}
