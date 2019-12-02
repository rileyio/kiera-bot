import { WebRouted } from '../../web-router'
import { TrackedChastiKeyLock } from '../../../objects/chastikey'

export namespace ChastiKeyWebStats {
  export async function locks(routed: WebRouted) {
    // Get Running Locks from local cache
    const cachedRunningLocks = await routed.Bot.DB.getMultiple<TrackedChastiKeyLock>('ck-running-locks', {})

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
      freezeCards: 0
    }

    // Counts
    var fixedLocks = 0
    var variableLocks = 0
    var totalLocks = 0
    var trusted = 0
    var botLocks = 0
    var keyholderLocks = 0

    // Process data and populate stats variables
    cachedRunningLocks.forEach(lock => {
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
      }

      // [ Count: KH Lock ]
      if (lock.lockedBy !== 'Zoe' && lock.lockedBy !== 'Chase' && lock.lockedBy !== 'Blaine' && lock.lockedBy !== 'Hailey') keyholderLocks++
      // [ Count: Bot Lock ]
      else botLocks++
      // [ Count: Fixed Lock ]
      if (lock.fixed === 1) fixedLocks++
      // [ Count: Variable Lock ]
      if (lock.fixed === 0) variableLocks++
      // [ Count: Trusted ]
      if (lock.trustKeyholder === 1) trusted++
      // [ Count: Total Locks ]
      totalLocks++
    })

    return routed.res.send({
      distributionByInterval,
      totalLocks,
      trust: trusted / totalLocks,
      trusted,
      fixedLocks,
      variableLocks,
      keyholderLocks,
      botLocks,
      distributionByLockedTimeFixed,
      distributionByLockedTimeFixedTrusted,
      distributionByLockedTimeVariable,
      distributionByLockedTimeVariableTrusted,
      distributionByCardsRemaining
    })
  }
}
