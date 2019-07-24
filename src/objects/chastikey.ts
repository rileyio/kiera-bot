import { ObjectID } from 'bson';

export enum ChastiKeyTickerType {
  None,
  Keyholder,
  Lockee,
  Both
}

export class TrackedChastiKey {
  public username: string = ''
  public ticker: TrackedChastiKeyTicker = new TrackedChastiKeyTicker({})
  public preferences: TrackedChastiKeyPreferences = new TrackedChastiKeyPreferences({})

  constructor(init: Partial<TrackedChastiKey>) {
    Object.assign(this, init);
  }
}

/**
 * Data specific to the KeyTicker
 * 
 * Username should be fetched from the User's TrackedChastiKey data
 * 
 * @export
 * @class TrackedChastiKeyTicker
 */
export class TrackedChastiKeyTicker {
  public type: ChastiKeyTickerType = ChastiKeyTickerType.Lockee
  public showStarRatingScore: boolean = false
  public date: string

  constructor(init: Partial<TrackedChastiKey>) {
    Object.assign(this, init);
  }
}

export class TrackedChastiKeyPreferences {
  keyholder: { showAverage: boolean } = {
    showAverage: false
  }
  
  constructor(init: Partial<TrackedChastiKeyPreferences>) {
    Object.assign(this, init);
  }
}


export class TrackedChastiKeyLockee {
  public username: string
  public joined: string
  public timestamp_last_active: number
  public secondsLockedInCurrentLock: number
  public averageTimeLockedInSeconds: number
  public longestCompletedLockInSeconds: number
  public totalNoOfCompletedLocks: number
  public averageRating: number
  public noOfRatings: number
}

export class TrackedChastiKeyLock {
  // Kiera props
  public readonly _id: ObjectID
  // Mapped in after
  public keyholder: string
  // ChastiKey Props
  public username: string
  public sharedLockID: string
  public regularity: number
  public multipleGreensRequired: number
  public timestampLocked: number
  public timestampNow: number
  public secondsLocked: number
  public fixed: number
  public cumulative: number
  public card_info_hidden: number
  public timer_hidden: number
  public noOfTurns: number
  public lock_frozen_by_card: number
  public lock_frozen_by_keyholder: number
  public discard_pile: string
  public version: string
  public build: number
  public lockedBy: string
  public display_in_stats: number
  public sharedLockName: string
  /// Cards ///
  public double_up_cards: number
  public freeze_cards: number
  public green_cards: number
  public red_cards: number
  public reset_cards: number
  public yellow_cards: number
}

export class TrackedChastiKeyUserAPIFetch {
  public response: Array<{ status: number; message: string; timestampGenerated: number }>
  public locks: Array<TrackedChastiKeyUserAPIFetchLock>
}

export class TrackedChastiKeyUserAPIFetchLock {
  public lockID: number
  public lockedBy: string
  public timestampLocked: number
  public timestampUnlocked: number
  public status: string
  public combination: number
}

export class TrackedChastiKeyUserTotalLockedTime {
  public username: string
  public totalSecondsLocked: number
  public totalMonthsLocked: number
}

export class TrackedKeyholderStatistics {
  public username: string
  public joined: string
  public noOfSharedLocks: number = 0
  public noOfLocksManagingNow: number = 0
  public noOfLocksFlaggedAsTrusted: number = 0
  public totalLocksManaged: number = 0
  public averageRating: number
  public noOfRatings: number
  public display_in_stats: number
  public dateFirstKeyheld: string

  constructor(init: Partial<TrackedKeyholderStatistics>) {
    Object.assign(this, init);
  }
}