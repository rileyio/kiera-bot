import * as Admin from './en/admin';
import * as ChastiKey from './en/chastikey';
import * as Decision from './en/decision';
import * as Error from './en/error';
import * as HelpStrings from './en/help';

export const en = {
  admin: {
    botManualRestart: Admin.botManualRestart,
  },
  chastikey: {
    adminRefreshStats: ChastiKey.adminRefreshStats,
    invalidOverrideType: ChastiKey.invalidOverrideType,
    incorrectTickerTimer: ChastiKey.incorrectTickerTimer,
    lockeeCommandNotification: ChastiKey.lockeeCommandNotification,
    lockeeOrKeyholderRequired: ChastiKey.lockeeOrKeyholderRequired,
    keyholderNoLocks: ChastiKey.keyholderNoLocks,
    keyholderCommandNotification: ChastiKey.keyholderCommandNotification,
    usernameNotSet: ChastiKey.usernameNotSet,
    userRequestedNoStats: ChastiKey.userRequestedNoStats
  },
  decision: {
    newQuestionAdded: Decision.newQuestionAdded
  },
  error: {
    commandExactMatchFailedOptions: Error.commandExactMatchFailedOptions,
    commandHelpMissing: Error.helpCommandMissing,
    commandDisabledInChannel: Error.commandDisabledInChannel,
    userNotRegistered: Error.userNotRegistered
  },
  help: {
    ck: HelpStrings.ck,
    decision: HelpStrings.decision,
    flip: HelpStrings.flip,
    // duration: HelpStrings.duration,
    // intensity: HelpStrings.intensity,
    // limit: HelpStrings.limit,
    main: HelpStrings.main,
    // react: HelpStrings.react,
    register: HelpStrings.register,
    roll: HelpStrings.roll,
  },

}