export class ChastiSafeUser {
  public badges: Array<'LOCKTOBER_ONGOING' | 'LOCKTOBER_2022' | 'LOCKTOBER_2022_SELF' | 'LOCKTOBER_ONGOING_SELF'> = []

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

  public hasChastiKeyData = false

  public keyholderLevels: {
    bondageLevel: string
    chastityLevel: string
    taskLevel: string
  }

  public keyholderLockCounts: {
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

  public levels: {
    bondageLevel: string
    chastityLevel: string
    taskLevel: string
  }

  public lockInfo: {
    chastityLocks: Array<ChastiSafeLock>
  }

  public ratings: {
    ratingsAsLockeeCount: number
    ratingsAsKeyholderCount: number
    averageRatingAsLockee: number
    averageRatingAsKeyholder: number
  }

  public selfStats: {
    LOYALTY: 0
    EMERGENCY: 0
    TASK: 0
    BONDAGE: 0
    CHASTITY: 0
  }

  public selfLockCounts: { EMERGENCY: 0; TASK: 0; BONDAGE: 0; CHASTITY: 0 }

  public stats: {
    LOYALTY: number
    TASK: number
    BONDAGE: number
    CHASTITY: number
    EMERGENCY: number
  }

  public status: false

  public user: string

  public get isLocktoberOngoingEligible() {
    return this.badges.includes('LOCKTOBER_ONGOING_SELF')
  }

  public get isLocktober2022Eligible() {
    return this.badges.includes('LOCKTOBER_2022_SELF')
  }

  public get isChastityLocked() {
    return this.lockInfo.chastityLocks.length > 0
  }

  constructor(init: Partial<ChastiSafeUser>) {
    Object.assign(this, init)

    try {
      // For each lock (if present)
      if (init.lockInfo.chastityLocks.length) this.lockInfo.chastityLocks = [...init.lockInfo.chastityLocks.map((l) => new ChastiSafeLock(l))]
    } catch (error) {
      console.log('Error parsing CS Locks data')
    }

    if (typeof this.chastikeystats === 'object') this.hasChastiKeyData = true
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
