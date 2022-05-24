export class ChastiSafeUser {
  public user: string
  public stats: {
    LOYALTY: number
    TASK: number
    BONDAGE: number
    CHASTITY: number
    EMERGENCY: number
  }

  public keyholderStats: {
    LOYALTY: number
    TASK: number
    BONDAGE: number
    CHASTITY: number
    EMERGENCY: number
  }

  public keyholderLockCounts: {
    LOYALTY: number
    TASK: number
    BONDAGE: number
    CHASTITY: number
    EMERGENCY: number
  }

  public ratings: {
    ratingsAsLockeeCount: number
    ratingsAsKeyholderCount: number
    averageRatingAsLockee: number
    averageRatingAsKeyholder: number
  }

  public chastikeystats: {
    averageKeyholderRating: number
    averageLockeeRating: number
    averageTimeLockedInSeconds: number
    cumulativeSecondsLocked: number
    joinTimestamp: string
    keyheldStartTimestamp: string
    longestCompletedLockInSeconds: number
    noOfKeyholderRatings: number
    numberOfLockeeRatings: number
    numberOfCompletedLocks: number
    totalLocksManaged: number
  }

  public levels: {
    bondageLevel: string
    chastityLevel: string
    taskLevel: string
  }

  public keyholderLevels: {
    bondageLevel: string
    chastityLevel: string
    taskLevel: string
  }

  public lockInfo: {
    chastityLocks: Array<ChastiSafeLock>
  }

  public status: false

  constructor(init: Partial<ChastiSafeUser>) {
    Object.assign(this, init)

    // For each lock (if present)
    if (init.lockInfo.chastityLocks.length) this.lockInfo.chastityLocks = [...init.lockInfo.chastityLocks.map((l) => new ChastiSafeLock(l))]
  }
}

export class ChastiSafeLock {
  public keyholder: string
  public lockName: string
  public loadtime: string

  constructor(init: ChastiSafeLock) {
    Object.assign(this, init)
  }
}
