import { Task } from '@/objects/task'
import { TrackedChastiKeyLock } from '@/objects/chastikey'

export class ChastiKeyGenerateStats extends Task {
  // Config for this task
  run = this.process
  schedule = '5 * * * *'
  settingPrefix = 'bot.task.chastikey.stats.schedule'

  protected async process() {
    // Perform the scheduled task/job
    try {
      await this.Bot.DB.add('ck-stats-daily', {
        interval: '60min',
        dateTime: new Date().toISOString(),
        date: new Date().toISOString().substr(0, 10),
        stats: await this.compileStats()
      })
      this.lastRun = Date.now()
      return true
    } catch (error) {
      console.log(error)
      this.lastRun = Date.now()
      return false
    }
  }

  private async compileStats() {
    // Get Running Locks from local cache for KH Cache
    const cachedRunningLocksKHs = await this.Bot.DB.aggregate('ck-running-locks', [
      {
        $match: { $and: [{ lockedBy: { $ne: null } }, { lockedBy: { $ne: '' } }] }
      },
      {
        $group: {
          _id: '$lockedBy',
          lockees: {
            $addToSet: '$userID'
          },
          runningLocks: { $sum: 1 },
          fixed: {
            $sum: {
              $cond: { if: { $eq: ['$fixed', 1] }, then: 1, else: 0 }
            }
          },
          variable: {
            $sum: {
              $cond: { if: { $eq: ['$fixed', 0] }, then: 1, else: 0 }
            }
          },
          infoHidden: {
            $sum: {
              $cond: { if: { $or: [{ $eq: ['$cardInfoHidden', 1] }, { $eq: ['$cardInfoHidden', 1] }] }, then: 1, else: 0 }
            }
          },
          trust: {
            $sum: {
              $cond: { if: { $eq: ['$trustKeyholder', 1] }, then: 1, else: 0 }
            }
          },
          frozen: {
            $sum: {
              $cond: { if: { $eq: ['$lockFrozen', 1] }, then: 1, else: 0 }
            }
          },
          secondsLocked: {
            $sum: {
              $subtract: [Date.now() / 1000, '$timestampLocked']
            }
          }
        }
      },
      {
        $lookup: {
          from: 'ck-users',
          localField: 'lockees',
          foreignField: 'userID',
          as: 'username'
        }
      },
      {
        $lookup: {
          from: 'ck-users',
          localField: '_id',
          foreignField: 'username',
          as: 'keyholder'
        }
      },
      {
        $sort: { runningLocks: -1 }
      },
      {
        $unwind: '$keyholder'
      },
      {
        $project: {
          _id: 0,
          keyholder: '$keyholder.userID',
          level: '$keyholder.keyholderLevel',
          averageKeyholderRating: '$keyholder.averageKeyholderRating',
          uniqueLockeeCount: { $cond: { if: { $isArray: '$lockees' }, then: { $size: '$lockees' }, else: 0 } },
          runningLocks: 1,
          fixed: 1,
          variable: 1,
          infoHidden: { $multiply: [{ $divide: ['$infoHidden', '$runningLocks'] }, 100] },
          trust: { $multiply: [{ $divide: ['$trust', '$runningLocks'] }, 100] },
          frozen: { $multiply: [{ $divide: ['$frozen', '$runningLocks'] }, 100] },
          lockees: '$username.userID',
          secondsLocked: 1
        }
      }
    ])

    // Get Running Locks from local cache for Locks Cache
    const cachedRunningLocks = await this.Bot.DB.aggregate<TrackedChastiKeyLock>('ck-running-locks', [
      {
        $addFields: {
          secondsLocked: { $subtract: [Date.now() / 1000, '$timestampLocked'] }
        }
      }
    ])

    // Distributions
    var distributionByInterval = [0, 0, 0, 0, 0, 0, 0] as Array<number>
    var distributionByLockedTimeFixed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as Array<number>
    var distributionByLockedTimeFixedTrusted = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as Array<number>
    var distributionByLockedTimeVariable = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as Array<number>
    var distributionByLockedTimeVariableTrusted = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as Array<number>
    var distributionByCardsRemaining = {
      resetCards: 0,
      greenCards: 0,
      yellowCards: 0,
      redCards: 0,
      doubleUpCards: 0,
      freezeCards: 0,
      stickyCards: 0
    }

    // Counts
    var fixedLocks = 0
    var variableLocks = 0
    var totalLocks = 0
    var keyholderTrust = 0
    var botTrust = 0
    var frozenLocks = 0
    var botLocks = 0
    var keyholderLocks = 0
    var selfLocks = 0

    var _keyholdersAvgRating = cachedRunningLocksKHs.map((kh: { averageKeyholderRating: number }) => kh.averageKeyholderRating)
    var keyholders = cachedRunningLocksKHs.length
    var keyholdersWithRating = _keyholdersAvgRating.filter((avg) => avg > 0).length
    var ratings = _keyholdersAvgRating.reduce((cur, total) => (total = cur > 0 ? (total += cur) : total))

    // Process data and populate stats variables
    cachedRunningLocks.forEach((lock) => {
      // [ By Interval ]
      if (lock.fixed === 0) {
        if (lock.regularity === 0.25) distributionByInterval[0]++ // 15 minutes
        if (lock.regularity === 0.5) distributionByInterval[1]++ // 30 minutes
        if (lock.regularity === 1) distributionByInterval[2]++ // 1 hour
        if (lock.regularity === 3) distributionByInterval[3]++ // 3 hours
        if (lock.regularity === 6) distributionByInterval[4]++ // 6 hours
        if (lock.regularity === 12) distributionByInterval[5]++ // 12 hours
        if (lock.regularity === 24) distributionByInterval[6]++ // 24 hours
      }

      // [ By Locked Time: Fixed ]
      // [ By Locked Time: Variable ]
      // > 1 hour
      if (lock.secondsLocked < 3600) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[0]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[0]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[0]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[0]++
      }
      // > 1 - 12 hours}
      if (lock.secondsLocked >= 3600 && lock.secondsLocked < 43200) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[1]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[1]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[1]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[1]++
      }
      // > 12 - 24 hours}
      if (lock.secondsLocked >= 43200 && lock.secondsLocked < 86400) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[2]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[2]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[2]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[2]++
      }
      // > 24 hours - 5 days}
      if (lock.secondsLocked >= 86400 && lock.secondsLocked < 86400 * 5) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[3]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[3]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[3]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[3]++
      }
      // > 5 days - 10 days}
      if (lock.secondsLocked >= 86400 * 5 && lock.secondsLocked < 86400 * 10) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[4]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[4]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[4]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[4]++
      }
      // > 10 days - 20 days}
      if (lock.secondsLocked >= 86400 * 10 && lock.secondsLocked < 86400 * 20) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[5]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[5]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[5]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[5]++
      }
      // > 20 days - 30 days}
      if (lock.secondsLocked >= 86400 * 20 && lock.secondsLocked < 86400 * 30) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[6]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[6]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[6]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[6]++
      }
      // > 30 days - 60 days}
      if (lock.secondsLocked >= 86400 * 30 && lock.secondsLocked < 86400 * 60) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[7]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[7]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[7]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[7]++
      }
      // > 60 days - 90 days}
      if (lock.secondsLocked >= 86400 * 60 && lock.secondsLocked < 86400 * 90) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[8]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[8]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[8]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[8]++
      }
      // > 90 days - 120 days}
      if (lock.secondsLocked >= 86400 * 90 && lock.secondsLocked < 86400 * 120) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[9]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[9]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[9]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[9]++
      }
      // > 120 days - 180 days}
      if (lock.secondsLocked >= 86400 * 120 && lock.secondsLocked < 86400 * 180) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[10]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[10]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[10]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[10]++
      }
      // > 180 days - 250 days}
      if (lock.secondsLocked >= 86400 * 180 && lock.secondsLocked < 86400 * 250) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[11]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[11]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[11]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[11]++
      }

      // >250 days}
      if (lock.secondsLocked >= 86400 * 250) {
        if (lock.fixed === 1) distributionByLockedTimeFixed[12]++
        if (lock.fixed === 1 && lock.trustKeyholder) distributionByLockedTimeFixedTrusted[12]++
        if (lock.fixed === 0) distributionByLockedTimeVariable[12]++
        if (lock.fixed === 0 && lock.trustKeyholder) distributionByLockedTimeVariableTrusted[12]++
      }

      // [ By cards remaining ]
      if (lock.fixed === 0 && lock.cardInfoHidden === 0) {
        distributionByCardsRemaining.resetCards += lock.resetCards
        distributionByCardsRemaining.greenCards += lock.greenCards
        distributionByCardsRemaining.yellowCards += lock.yellowCards
        distributionByCardsRemaining.redCards += lock.redCards
        distributionByCardsRemaining.doubleUpCards += lock.doubleUpCards
        distributionByCardsRemaining.freezeCards += lock.freezeCards
        distributionByCardsRemaining.stickyCards += lock.stickyCards
      }

      // [ Count: KH Lock ]
      if (lock.lockedBy !== 'Zoe' && lock.lockedBy !== 'Chase' && lock.lockedBy !== 'Blaine' && lock.lockedBy !== 'Hailey') keyholderLocks++
      // [ Count: Bot Lock ]
      else botLocks++
      // [ Count: Fixed Lock ]
      if (lock.fixed === 1) fixedLocks++
      // [ Count: Frozen ]
      if (lock.lockFrozen === 1) frozenLocks++
      // [ Count: Variable Lock ]
      if (lock.fixed === 0) variableLocks++
      // [ Count: Bot Trusted ]
      if (lock.trustKeyholder === 1 && lock.lockedBy !== '' && lock.botChosen === 0) botTrust++
      // [ Count: KH Trusted ]
      if (lock.trustKeyholder === 1 && lock.lockedBy !== '' && lock.botChosen === 0) keyholderTrust++
      // [ Count: Self Locks ]
      if (lock.lockedBy === '') selfLocks++

      // [ Count: Total Locks ]
      totalLocks++
    })

    return {
      distributionByInterval,
      totalLocks,
      keyholderTrust: keyholderTrust / keyholderLocks,
      botTrust: botTrust / botLocks,
      fixedLocks,
      frozenLocks,
      variableLocks,
      keyholderLocks,
      selfLocks,
      botLocks,
      keyholdersCount: keyholders,
      keyholderAvgRating: ratings / keyholdersWithRating,
      distributionByLockedTimeFixed,
      distributionByLockedTimeFixedTrusted,
      distributionByLockedTimeVariable,
      distributionByLockedTimeVariableTrusted,
      distributionByCardsRemaining,
      keyholders: cachedRunningLocksKHs
    }
  }
}
