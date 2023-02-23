export type ChastiSafeUserKeyholderLevels = 'Novice' | 'Keyholder' | 'Established' | 'Distinguished' | 'Renowned'
export type ChastiSafeUserLockeeLevels = 'Novice' | 'Intermediate' | 'Experienced' | 'Devoted' | 'Fanatical'
export enum ChastiSafeUserKeyholderLevelsEnum {
  'Novice',
  'Keyholder',
  'Established',
  'Distinguished',
  'Renowned'
}
export enum ChastiSafeUserLockeeLevelsEnum {
  'Novice',
  'Intermediate',
  'Experienced',
  'Devoted',
  'Fanatical'
}

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
    bondageLevel: ChastiSafeUserKeyholderLevels
    chastityLevel: ChastiSafeUserKeyholderLevels
    taskLevel: ChastiSafeUserKeyholderLevels
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
    bondageLevel: ChastiSafeUserLockeeLevels
    chastityLevel: ChastiSafeUserLockeeLevels
    taskLevel: ChastiSafeUserLockeeLevels
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
    return this.badges.includes('LOCKTOBER_ONGOING_SELF') || this.badges.includes('LOCKTOBER_ONGOING')
  }

  public get isLocktober2022Eligible() {
    return this.badges.includes('LOCKTOBER_2022_SELF') || this.badges.includes('LOCKTOBER_2022')
  }

  public get isChastityLocked() {
    return this.lockInfo.chastityLocks.length > 0
  }

  public get highestKeyholderLevel(): ChastiSafeUserKeyholderLevels {
    // const { bondageLevel, taskLevel, chastityLevel } = this.keyholderLevels
    // const levels = [ChastiSafeUserKeyholderLevelsEnum[bondageLevel], ChastiSafeUserKeyholderLevelsEnum[taskLevel], ChastiSafeUserKeyholderLevelsEnum[chastityLevel]]
    // console.log(levels)
    return this.keyholderLevels?.chastityLevel
  }

  public get highestLockeeLevel(): ChastiSafeUserLockeeLevels {
    // const { bondageLevel, taskLevel, chastityLevel } = this.levels
    return this.levels?.chastityLevel
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
