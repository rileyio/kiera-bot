import * as Error from './en/error';
import * as ChastiKey from './en/chastikey';
import * as HelpStrings from './en/help';

export const en = {
  chastikey: {
    invalidOverrideType: ChastiKey.invalidOverrideType,
    incorrectTickerTimer: ChastiKey.incorrectTickerTimer,
    usernameNotSet: ChastiKey.usernameNotSet,
    lockeeOrKeyholderRequired: ChastiKey.lockeeOrKeyholderRequired,
    keyholderNoLocks: ChastiKey.keyholderNoLocks
  },
  error: {
    commandExactMatchFailedOptions: Error.commandExactMatchFailedOptions,
    commandHelpMissing: Error.helpCommandMissing,
    userNotRegistered: Error.userNotRegistered
  },
  help: {
    ck: HelpStrings.ck,
    decision: HelpStrings.decision,
    duration: HelpStrings.duration,
    // intensity: HelpStrings.intensity,
    limit: HelpStrings.limit,
    main: HelpStrings.main,
    react: HelpStrings.react,
    register: HelpStrings.register,
    roll: HelpStrings.roll,
  },

}