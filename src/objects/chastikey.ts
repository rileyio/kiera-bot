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
  public startDateDD: number
  public startDateMM: number
  public startDateYY: number

  constructor(init: Partial<TrackedChastiKey>) {
    Object.assign(this, init);
  }
}

export class TrackedChastiKeyLock {
  // Kiera props
  public readonly _id: ObjectID
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
  public noOfTurns: number
  public version: string
  public build: number
}