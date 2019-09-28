export const adminRefreshStats = `Manual stats refresh triggered..`

// Error
export const usernameNotSet = `You'll need to tell the bot your username in order to use this command, Set your username (found in the ChastiKey app) using \`{{prefix}}ck username YourUsernameHere\``
export const usernameNotSetByOwner = `The requested ChastiKey username does not exist -or- the owner of it has not set it with Kiera.`
export const usernameNoResultsFromServer = `User not found!`
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
  - Have not opened (ChastiKey) the App in >=2 week, if this is the case, try opening the app and wait ~30 minutes for the stats to refresh.
  - Wrong Username set with Kiera, the username that needs to be set with Kiera is from the ChastiKey app.
  - Quotes stored with username, if you see something like “YourUsernameHere” then try setting again without the “ ”`

// Verify
export const verifyNotSuccessfulUsingReason = `{{reason}}`
export const verifyDMInstructions = `Scan this code with the ChastiKey App like loading a lock (within the next 5 minutes), this will verify your Discord Account to ChastiKey.`
export const verifyCkeckYourDMs = `Check your DMs from Kiera for further instructions.`