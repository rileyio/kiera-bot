export const adminRefreshStats = `Manual stats refresh triggered..`

// Error
// export const usernameNotSet = `You'll need to tell the bot your username in order to use this command, Set your username (found in the ChastiKey app) using \`{{prefix}}ck username YourUsernameHere\``
// export const usernameNotSetByOwner = `The requested ChastiKey username does not exist -or- the owner of it has not set it with Kiera.`
export const userNotFoundRemote =  `User could not be found on the ChastiKey server.`
export const userNotFound = `User not found! The owner of the ChastiKey account must \`{{prefix}}ck verify\` in order to proceed with calling this command upon them.`
export const userLookupErrorOrNotFound = `A ChastiKey user with that username could not be found!`
export const keyholderOrAboveRoleRequired = `Calling this command for another user requires you hold the Keyholder or above role.`

// Ticker
export const invalidOverrideType = `Invalid override type, please use: (1) Keyholder, (2) Lockee, (3) Both`
export const incorrectTickerTimer = `*Does something look incorrect? Please contact **Kevin** the developer of ChastiKey if any numbers appear incorrect*`


// Lookup notification
export const lockeeCommandNotification = `\`{{user}}\` has just looked up your **lockee** stats in \`{{channel}}\` on the \`{{server}}\` server`
export const keyholderCommandNotification = `\`{{user}}\` has just looked up your **keyholder** stats in \`{{channel}}\` on the \`{{server}}\` server.`

// Stats
export const lockeeOrKeyholderRequired = `You'll need to supply a type with that command such as \`{{prefix}}ck stats lockee\` \`{{prefix}}ck stats keyholder\``
export const keyholderNoLocks = `The requested user seems to not have any active locks or past lockees, there will be no stats to display`
export const userRequestedNoStats = `This user has requested their stats remain private`
export const lockeeStatsMissing = `There seems to be an error finding this user's stats (\`{{user}}\`), here are some common issues:
  - Has not opened (ChastiKey) the App in >=2 week, if this is the case the app will need to be opened & wait ~15-30 minutes for the stats to refresh.
  - The user does not participate in locking.`
export const lockeeStatsHistorical = `Check your DMs from Kiera for the detailed output.`

// Verify
export const verifyNotSuccessfulUsingReason = `{{reason}}`
export const verifyDMInstructions = `Scan this code with the ChastiKey App like loading a lock (within the next 5 minutes), this will verify your Discord Account to ChastiKey.\n\nIf your ChastiKey account is new in the last 15-30 minutes, it may take this long for Kiera to receive all the required data.`
export const verifyCkeckYourDMs = `Check your DMs from Kiera for further instructions.`
export const verifyFastForward = `Your account has been verified! Some data may still take **up to 15 minutes** to be cached and fully accessable.`
export const verifyPreviouslyCompleted = `Your account has already been verified! If there are any issues with this please reachout to @emma#1366`
export const verifyVerifyReq2 = `This command requires your account be verified with ChastiKey using the following command: \`!ck verify\`\n\nIf you just did this in the last 15 minutes or less, you can speed up some of the verification update process by running \`!ck verify\` again.`