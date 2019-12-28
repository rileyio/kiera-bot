export const userStatsNowDisabled = `All stats have now been Disabled for your account (across all servers where Kiera is present).

  - If you wish to delete all recorded stats to date you can run the following command \`{{prefix}}stats delete user\`.
  - Disabling alone stops new logging going forward only.
  - When user statistics are disabled but not deleted your statistics may still appear on Channels or Servers in total counts.
  - The \`{{prefix}}stats user\` command will now be disabled for your profile.
  - What's not disabled with this command:
    - Your personal Kiera usage audit log which can be found for your account @ https://kierabot.xyz (Your commands ran, success, etc)
    - Other commands such as the Decision log or places where that are not purely statistics

For more information about Statistics, see the \`{{prefix}}stats about\` command output.
`

export const userStatsNowEnabled = `Stats are now Enabled again for your account (across all servers where Kiera is present).

For more information about Statistics, see the \`{{prefix}}stats about\` command output.
`

export const aboutStats = `Below you'll find information on what's considered a statistic by Kiera:

This Server Has Stats: \`{{serverState}}\`
Your Stats are Currently: \`{{userState}}\`
Your Stats Entries (From all servers): \`{{count}}\`

**These statistics consist of:**
  - Date & Time
  - Server ID
  - Channel ID
  - User ID
  - Type of statistic (Action seen, Example: Message, Server Join, Reaction, Name of Command used, etc)
  - If its a Kiera command it will contain only the command name & the success state

**These Statistics do not contain:**
  - Message body (nothing that's contained within the message body, Text, Image, URL, etc)
  - Message ID
  - The outcome body of any commands
  - User or Nicknames
  - Anything in DMs where Kiera is not present

**About Disabling Statistics:**
  - At the User level: None of these stats will be recorded (inc: Server or Channel)
  - At the Channel level: No stats on the channel or users will be recorded within that channel
  - At the Server level: No stats recorded on the server (inc: Channel or User)
`

export const channelStatsDisabled = `All stats have now been **Disabled** for this channel.

  - If you wish to delete all recorded stats to date you can run the following command \`{{prefix}}stats delete channel\`.
  - Disabling alone stops new logging going forward only.
  - When channel statistics are disabled but not deleted they may still appear on Server or User statistics.
  - The \`{{prefix}}stats channel\` command will now be disabled for this channel.

For more information about Statistics, see the \`{{prefix}}stats about\` command output.
`

export const channelStatsEnabled = `Stats are now **Enabled** for this channel.

For more information about Statistics, see the \`{{prefix}}stats about\` command output.
`

export const channelStatsDeletionConfirm = `To confirm deleting all stats pertaining to this channel, send **\`yes\`** in the next 60 seconds!`
export const channelStatsDeletionConfirmReceived = `Confirmation Received! Channel Stats Deletion in progress... please wait`
export const channelStatsDeletionDeleted = `Stats \`(count: {{count}})\` for this channel have been deleted!`
export const channelStatsDeletionCancelled = `Channel Stats Deletion Cancelled! Reply not received before timeout (1 minute).`
export const channelStatsDeletionNoStats = `There are no stats stored for this channel!`

export const channelStatsDisabledInfo = `This Channel has requested stats be disabled - (Note: It may appear in server or user statistics unless all stored statistics for the channel are deleted.)`