export interface TrackedSharedKeyholderStatistics {
  _id: string
  keyholders: Array<string>
  count: number
  uniqueKHCount: number
}

export interface TrackedKeyholderLockeesStatistics {
  _id: string
  locks: Array<{
    fixed: boolean
    timer_hidden: boolean
    lock_frozen_by_keyholder: boolean
    lock_frozen_by_card: boolean
    keyholder: string
    secondsLocked: number
    noOfTurns: number
    sharedLockName: string
    cumulative: boolean
  }>
}

export const indicatorEmoji = {
  Frozen: `<:frozenlock:539233483537645568>`,
  Hidden: `<:hiddencircle:474973202607767562>`,
  TrustedKH: `<:trustkeyholder:474975187310346240>`
}

export const cardsEmoji = {
  DoubleUp: `<:4_:601169095982841856>`,
  Freeze: `<:1_:601169050294419476>`,
  GoAgain: '<:2_:601169068837568542>',
  Green: `<:3_:601169082066141238>`,
  Red: `<:5_:601169109954330635>`,
  Reset: `<:6_:601169148843917322>`,
  Sticky: `<:stickycard:726348014977024011>`,
  Yellow: `<:10:601169212370583553>`,
  YellowAdd1: `<:7_:601169162370416640>`,
  YellowAdd2: `<:8_:601169176651890700>`,
  YellowAdd3: `<:9_:601169195744362516>`,
  YellowMinus1: `<:11:601169242859110436>`,
  YellowMinus2: `<:12:601169259107713045>`
}