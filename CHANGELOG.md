# Change Log

## v11

> ⚠️ The changes in v11 are not final. Once the beta period is over, the changelog will be updated with the final changes.

### 11.0.0-beta-2

- Added: New libraries for project changes (see below + some supporting extensions).
- Added: Detection lib for detecting if running inside docker container - more support around this coming.
- Added: Autocomplete to Decision Roll command for selecting a decision roll more easily.
- Updated: Project from `commonjs` to `esm`.
- Updated: Imports aliases, maps and general cleaning.
- Updated: Mongodb driver from v3 to v5.
- Updated: Replaced `ts-node-dev` with `nodemon`.
- Updated: Various dependencies `agenda`, `random`, `typescript`.
- Updated: Utils removing old namespaces.
- Updated: CS Integration update command to include 2023 event.

### 11.0.0-beta-1

- Fixed: Logger `.warn` not working properly.
- Added: Router support for autocomplete values with Discord slash commands.
- Updated: Node from v16 to v18.
- Updated: Rework of Router's add/remove command procedures.
- Updated: Router's Discord command route add and removal within Router's route manage procedures.
- Updated: Startup's console output to include current node version.
- Updated: Router's ability to unload a specific route.

---

## 10.2.2

### 🛠️ Fixes

- Fixed: CS Profile stats in the wrong order & mixed values.
- Fixed: [#77](https://github.com/rileyio/kiera-bot/issues/77) Return an error to the user when CS profile is not found.

### 🪄 Updates

- Updated: Project dependencies to latest within ranges.
- Updated: Various project management items.

### 🌟 Added

- Added: New/Expanded CS Profile stats.

---

## 10.2.1

### 🛠️ Fixes

- Fixed: [#95](https://github.com/rileyio/kiera-bot/issues/95) A server's `commandGroups` in the DB is reset on Guild Change event.
- Fixed: [#90](https://github.com/rileyio/kiera-bot/issues/90) CS Stats output showing inconsistent results compared to 3rd party's (KH).
- Fixed: [#87](https://github.com/rileyio/kiera-bot/issues/87) Newly introduced (v10.2) management script not fully working due to names.

### 🪄 Updates

- Updated: Locale renderer to remove double newlines and replace with single newline.

---

## 10.2.0

### 🛠️ Fixes

- Fixed: Permissions assigned when creating managed channel.
- Fixed: API endpoint `/api/audit-log` not working.

### 🪄 Updates

- Updated: Managed Channel output to use DDHHMM format.
- Updated: Error text and permissions check for Managed Countdown channel creation needing `Connect` and `Manage Channels` at minimum.
- Updated: Multiple class and type names to align better + for upcoming platform(s) plan.
- Updated: Route Category names to accept dynamic name values.
- Updated: CS command group to be Opt in - Serer Admins can enable these via a command.
- Updated: CS less occurrences of `n/a` should be seen in stats now, now conditionally rendered or wills show `--`.
- Restored: CS Update experience level management functionality.
- Replaced: Old API cookies middleware with custom cookie management utility.

### 🌟 Added

- Added: Kiera management commands for easier process management at server level.
- Added: New Discord command payload generator for registering routes on the backend.
- Added: NSFW channel support (marked commands will not even show up in non-NSFW channels).
- Added: Opt in setting for use on some new (and old) command(s) that maybe shouldn't be enabled everywhere.
- Added: Server Admins can enable `Opt in` specific command categories on a server by server basis via a command.
- Added: New command to toggle command groups on and off (opt in/out).

---

## 10.1.1

### 🛠️ Fixes

- Fixed: Certain Decision Roll outcomes were causing issues with composing a response.

---

## 10.1.0

### 🛠️ Fixes

- Fixed: Decision Rollers broken in previous update.
- Fixed: CS Locktober Event eligibility badge check.

### 🪄 Updates

- Updated: Is Registered check now will reply privately to the user.

### 🌟 New Additions

- Added: Paging buttons to the bottom of the Decision List command output for users with many decision rollers.

---

## 10.0.0

### 🛠️ Fixes

- Fixed: API Loading.

### 🪄 Updates

- Updated: `discord.js` upgraded from v13 to v14.
- Updated: Most other Core Dependencies to latest major releases and applied patches.
- Updated: Improved description for CS lookup.

### 🌟 New Additions

- Added: NSFW command router check for command groups designated so.
- Added: Managed Channel Countdown command to generate and auto update a channel countdown.
- Added: Plugin System.
- Added: Raider.io plugin.
- Added: Slash Command Reload where applicable.
- Added: ChastiSafe Update command.

---

9.3.1

- Fixed: /cs user help text.
- Fixed: /cs user lookup issue where users with no CK data would not work properly.

  9.3.0

- Fixed: Stats commands not working.
- Added: Decision roll outcome type option when adding an outcome.
- Added: ChastiSafe User Lookup command.

  9.2.1

- Removed: Message prefix info reply.

  9.2.0

- Removed: ChastiKey.

  9.1.1

- Fixed: Register command. Will rework this in the future.

  9.1.0

- Added: Informational message to explain (while it still works) that commands now must be in Slash Command format.
- Updated: Docker mapping to once again allow API access.
- Updated: Dependencies.
- Removed: References to old prefix system in code.
- Removed: Reaction handling.

  9.0.0

- Updated: Converted most core commands to slash commands.

  8.0.0-beta-3

- Added: Support for Kiera to use Slash commands (Work in Progress to migrate certain commands to develop this further)
- Added: Reply shorthand functionality for commands to reply to command author (Work in Progress with upgrading existing commands)
- Updated: CK Update will now list all events and lockee updates together instead of just a first match.

  8.0.0-beta-2

- Updated: discord.js from v12 to v13.
- Updated: CK Update output to no longer contain inline fields.
- Added: CK Locktober 2021.

  8.0.0-beta-1

- Fixed: CK Update output should not show an x emoji when successful.
- Fixed: Custom server prefix setting not persisting through restarts.
- Updated: Stats outputs are now the past 30 days for all types (Server, Channel and User).
- Added: More scheduled cleanup tasks for various data.

  7.4.0

- Fixed: Roll command with no params supplied not returning any output.
- Fixed: CK Update user @ tagging.
- Updated: CK Debug command to be useable by all users.
- Updated: CK Update output to an embedded message with an improved layout.
- Updated: CK Update to now allow specific server owner mapped roles to call this command.

  7.3.0

- Fixed: CK Service requests not working - Requires removal of BNet commands/functionality until it can be reworked.
- Updated: Roll command now supports dice rolls formatted like 2d8 (PR #47)
- Updated: Trimmed/Reduction of Kiera command audit log.

  7.2.2

- Fixed: Discord API Intents update temporarily as a resolution.

  7.2.1

- Fixed: CK Update not updating users using the 3rd color role between the 2 highest roles.

  7.2.0

- Fixed: Help command not working in DMs.
- Fixed: Server joining and on startup server's database collection information.
- Added: Shorter Decision roll IDs or an option for custom names. #21

  7.1.1

- Fixed: English text string for ChastiKey.Customize.MapExpRole to use key names introduced in v7.1.0.
- Fixed: CK Customize command not able to process values above the previous maximum index, updated for new indexes (105 -> 555).

  7.1.0

- Fixed: CK Ticker missing note about CK's developer when running type 1 or 2 ticker requests.
- Fixed: CK Update where unable to process roles that have not been mapped.
- Fixed: CK Update now able to remove roles regardless if they have the proper role yet or not.
- Updated: CK Ticker command to allow lookup by username.
- Updated: CK Ticker command to allow date override for ticker start date.
- Added: CK Ticker message if user has a ticker override date preference set.
- Added: CK Update 3rd option for roles and updated names of existing in reference text.

  7.0.3

- Fixed: Issue with connecting to some existing servers. #45
- Updated: Dev dependency responsible for audit warnings.

  7.0.2

- Fixed: Bot unable to reply to DMs due to internal issue trying to find a server for config. #44

  7.0.1

- Fixed: English string for CK Special Roles text showing the Locked and Unlocked (once mapped) in reverse.

  7.0.0

- Added: Custom per server prefix support.
- Added: Command to set bot's presence message.
- Added: Presence Status rotator task.
- Added: Command routing alias support. Support added to a limited set for initial testing.
- Added: Support for CK Update command to be used on all servers (New CK Customize commands to map roles).
- Updated: CK Nickname command to have a reset (use: clear) also now has status responses.
- Updated: Response renderer to include Prefix from server.
- Updated: Verify command now will use server's prefix in help text.

  6.3.0

- Fixed: CK Locktober last updated footer timestamp.
- Fixed: CK Fanatical role auto update from CK Update command sometimes giving Devoted as well.
- Updated: CK Role Counts command stats to include the new Fanatical role.

  6.2.0

- Updated: Dependencies audit and update.
- Updated: Hopefully improved ck update command's removal step in code for future adjustments.
- Added: CK Locktober 2020 and adjusted 2019 in all code references.
- Added: CK Fanatical role for ck update command.
- Removed: CK Update's role ID lookup on the Kiera Bot Discord server, opting to use the ChastiKey server only for further ck role update testing.

  6.1.2

- Fixed: CK Lockee History total locks completed where it was counting locks still locked in the total.

  6.1.1

- Fixed: CK Stats commands embedded footer dates.
- Updated: Formatting on CK Stats Lockee Lock fields.
- Updated: ChastiKey.js lib.
- Added: CK Stats Lockee Sticky cards remaining.
- Added: Twitter line (if set in CK App) to show on Keyholder stats.

  6.1.0

- Fixed: Database connections to non-atlas DB provider.
- Updated: Ping response.
- Added: Extra error catching to DB Queries to get logging data.

  6.0.0

- Fixed: isCKVerified middleware could sometimes be bypassed causing errors if user used ChastiKey App to link account.
- Fixed: Dutch translation on POEditor.
- Fixed: CK Stats lockee not working when user is not CK Verified.
- Fixed: CK Update command's nickname with 🔓 or 🔒 depending if there is an active lock or not.
- Fixed: CK Verify middleware and command.
- Fixed: CK Update nickname issue when no nickname is set to just use the username.
- Fixed: Mod Mute command not listing mutes if a member could not be found.
- Fixed: Large Emoji showing on CK Stats Lockee when there's no Lock name. #36
- Fixed: CK Ticker command. #34
- Fixed: CK Stats Lockee command template is printing <> as gt & lt #33
- Fixed: Mod Mute not working on users of the same role or higher than Kiera's role position + excluding @everyone and Nitro Booster for being unmanaged roles.
- Fixed: CK extended props object when loading and merging with defaults.
- Updated: Bot User Audit Log now limited to most recent 200 entries in API fetch by default due to performance.
- Updated: Localization updates for [Dutch, German]
- Updated: Admin CK stats command to work once again for those users who can trigger a full update.
- Updated: Command Router's ChastiKey middleware & command errors when lookup fails.
- Updated: Localization with updates to date for [German]
- Updated: Dependencies audit and update.
- Updated: CK Lockee Stats command to show fewer locks (Max: 5) due to character cap on Discord Embedded messages.
- Added: Nickname length check as to not run into a too many character issue when users try to CK Update with a long Nickname or Username.
- Added: API endpoint for fetching number of records from the DB as the owner (By Discord Snowflake)
- Added: ChastiKey Stats Sticky Card.
- Added: Enabled check for Server Stats, now required enabled state to track stats.
- Added: CK update command will now change your username to add 🔓 or 🔒 depending on what the setting is set to.
- Added: New ck command to set if/when to set a 🔓 or 🔒 depending on your linked ChastiKey account status.
- Added: Localization support. Included this release: [ de, en, fr-FR, nl ]. Translations in progress.
- Added: New help menus. Some legacy menus will remain but will be converted in future updates.
- Added: Help descriptions to almost all commands for use in new help menu texts and for localization.
- Added: Intents for Discord.js on startup - Currently using all as existing functionality would be impacted.
- Added: New template renderer (handlebars.js)
- Added: New prompt & input helpers - Will be slowly migrating some existing commands that could use it over future updates.
- Added: Improved backend logging to help debug issues, especially with errors.
- Added: Ability for a decision roll to have Managers added. Managers will be able to perform any action on a decision roll except delete it all together. #30
- Changed: `!decision "id" add "Outcome Text"` to `!decision "id" outcome add "Outcome Text"`
- Removed: Old code from User object used primarily by Legacy permissions and decommissioned site - need to reevaluate remaining.
- Removed: Old commands and middleware used for testing.
- Removed: Command for CK Set Username (no longer in use with CK Verify command replacing functionality)
- Removed: Command for Ext Web Session (was replaced in a previous release)
- Removed: "Days ago" text from CK Stats Lockee command in favor of the {i18n}.yml.

  5.1.1

- Fixed: Decision Roll not working on servers where the roll author is not present #28
- Fixed: CK Stats Keyholder not working, no response from kiera #26

  5.1.0

- Fixed: ChastiKey username changes should now properly update on the Kiera record side when a change is detected upon running a command.
- Fixed: CK stats lockee removing card pick value when lock is of the fixed type.
- Fixed: CK keyholder lockees command where the username was returning undefined.
- Fixed: CK lockee history command counting fakes that are still locked but the non-fake is unlocked.
- Fixed: CK lockee history command including fakes in total days over past 12 months locked time.
- Fixed: Command case sensitivity.
- Fixed: API Decision description update failing when empty string.
- Fixed: CK stats lockee where Fixed locks showed the next pick text as now and it should not be.
- Updated: CK Update command to work with new 1-5 calculated value API server side for KH Role.
- Updated: CK Admin Refresh stats to display under maintenance message while a new course of action is determined for refreshing data manually.
- Updated: CK Role counts command to show new distinguished role.
- Updated: CK stats lockee to show `Self Locked` instead of two quotes
- Updated: Decision Outcome result now gets stored as well as outcome ID due to random value options.
- Updated: Decision Properties update now updates all props except Outcomes which are still their own API calls.
- Added: #19, #20 Markdown support for decision outcomes.
- Added: #22 Description/Subtitle area to decisions.
- Added: #18 Footer note with author's name.
- Added: Random number between support to text, url & markdown decisions via `{{roll-0-100}}`
- Added: 3rd party module to shorten random number calls & help add more randomness vs vanilla implementation
- Added: Saved Decision roll log, logging, and last 5 in log command.
- Added: Alt text for Keyholder Lockees command when no lockees in list.
- Added: Decision ID update command to generate new ID and DM the author (Updates Decision and Log entries).
- Added: Decision User Blacklisting commands and implemented at roll runtime (Silently fails).
- Added: Decision Server Whitelisting commands and implemented at roll runtime (Fails with a message).
- Added: Decision Outcome Consume Modes.
- Added: Decision Outcome Consume Mode control commands.
- Added: API Decision get decision.
- Added: API Decision consume mode controls.

  5.0.2

- Fixed: CK Debug Verify check lookup

  5.0.1

- Fixed: CK Web KH Stats Data

  5.0.0

- Fixed: #13 CK Stats Lockee and Keyholder no longer working after release of 4.12.0
- Fixed: CK Verify middleware error message to use proper prefix for env
- Fixed: CK Help Text
- Improved: #14 Project imports
- Improved: CK Stats Lockee is now using live data
- Improved: CK Lockee Queries on External portal will now be the same live data as CK stats lockee
- Improved: New One time login tokens to authenticate, now with expiry & much shorter (will be used on Kiera's site rework)
- Improved: Background task system using new scheduler
- Removed: Legacy notifications
- Removed: Old CK Auth token/session system
- Updated: CK Tasks all updated to new API Data
- Updated: CK KH Lockees command to only show lockees for your own account as a KH
- Added: New Web API authentication (will break kiera.xyz until rework)
- Added: #15 Server & User stats and commands for: display, manage, settings
- Added: #17 ChastiKey Verified users to have their profile auto updated with the Verified role
- Added: CK Lockee History that's a combination of previously discussed, removed all others
- Added: Legacy Task Template for older CK endpoints
- Added: New on API task fetch fail don't wipe Database but wait for next refresh time unless bot is restarted

  4.12.0

- Fixed: Text on CK Lockee stats saying: (not greens)
- Fixed: Moderator Mute to not allow a mute on a user with one already tracked
- Fixed: Moderator Unmute will now find the appropriate record if there are multiple for one user
- Fixing/Improving: BNet service for token caching
- Updated: WoW Character command for changes to BNet Service
- Updated: Look of !ck update command summary
- Updated: Increasing margin in CK Verify QR image after seeing an issue
- Added: Moderator Mute will now better track for later listing who muted someone
- Added: D3 Current Season and Profile commands
- Added: CK Established and Renowned KH upgrade checks to !ck update command
- Added: CK Verified to text line into Lockee and KH stats blocks

  4.11.0

- Updated: API Decisions
- Added: Flags for disabling Decisions & their Outcomes (only the former setup presently)

  4.10.2

- Updated: Kiera+ChastiKey data
- Updated: `!ck ext session` command to `!ck web`
- Updated: `!ck update` to improve performance

  4.10.1

- Added: CK Ext Lockee endpoint.

  4.10.0

- Added: CK Ext code - used for the ChastiKey-Web app project.

  4.9.1

- Fixed: CK KH lookup case sensitivity issue in name supplied.

  4.9.0

- Re-Enabling: Lockee history commands but only in DMs for now.
- Fixed/Added: More detail to ChastiKey command outputs with regards to requestor & cached timestamp of data.
- Fixed/Added: Error reasons for failed user stats lookups.
- Fixed/Added: Performance to Most CK command outputs.

  4.8.1

- Disabling: Lockee history until rework.

  4.8.0

- Added: CK Search command to perform searches based on username.
- Added: CK Lockee Historical stats command.
- Removed: CK Username command from auto generated help menu.
- Removed: Secondary API call previously needed to collect all data for CK stats lockee like cumulatives. Should improve performance.
- Fixed: CK Update query internal DB query error.

  4.7.1
  Fixed: Issue with CK Stats Locktober percentage and DB query used to find post data format changes.

  4.7.0

- Added: Restored select Bot admin commands.
- Updated: Internal code to align with ChastiKey data feed changes.
- Fixed: CK Debug command which data feed changes helped resolve as well.
- Fixed: CK Stats Lockee command only accepting exact case matches.

  4.6.0

- Added: CK Debug commands for Moderators to assist with Kiera Bot issues.

  4.5.1

- Fixed: CK Stats Keyholder to query proper data.

  4.5.0

- Added: All CK commands (except: Verify) will require verification but now will also update a user's verified status & username with kiera automagically.
- Added: Moderator command set for managing user mute functionality.
- Added: 🎃 Emoji to users to qualify for Locktober in stats print.
- Added: CK specific role counts command for statistics.
- Updated: All CK API Endpoint paths.
- Updated: ChastiKey Object definitions.
- Re-enabled: CK set username with Command Deprecated message.
- Fixed: CK Stats Lockee -or- KH condition where right after verify error is saying to verify, better instructions and a temp way around.
- Fixed: CK Stats Keyholder query to exclude fakes from totals and calculations.

  4.4.0

- Updated: CK recover combos command to work only when Verified.
- Updated: CK isCKVerified middleware to check new dataset, will speed up step.
- Updated: CK Stats Locktober command to completely utilize new direction with lookups & verification.
- Updated: CK Verify command will now replace !register & !ck username UNameHere.
- Updated: Remaining CK commands converted to require verify.
- Updated: Lockee and KH stats prints to show Verified check mark when others lookup where applicable.
- Removed: CK Set Username command.

  4.3.0

- Added: More statistics to CK Locktober stats command.
- Added: CK Update command will now verify if Novice KHs are eligible for the Regular KH role.
- Updated: CK Update command to account for Role color changes and using IDs now.
- Fixed/Updated: CK Update command will now check if you have Locked, Unlocked, or a Lockee Color role before assigning Locked -or Unlocked.

  4.2.0

- GoLive: ChastiKey Locktober 2019 event!
- Added: Background task to manage Event/Role assignment.
- Added: Middleware for ChastiKey verification, Implemented on !ck update command.
- Added: Condition for CK Locktober stats to show verification info if not verified when running command.
- Updated: CK Update command to use Discord ID to determine event eligibility.
- Updated: CK Data refresh frequencies.
- Updated: CK Locktober event to only show stats for those who have verified.
- Removing: Old unused ChastiKey dataset.

  4.1.2

- Fixed: Bugs & Issue with multiple conditions being met and assigning the wrong Experience role.

  4.1.1

- Fixed: CK Update command accidentally deleting old Experience role when it should not have been.

  4.1.0

- Updated: Kiera to use newer API formatted output
- Updated: Command router to better handle permissions between Servers and DMs
- Added: Verify check marks for regular CK stats lookups (lockee & kh)
- Added: ChastiKey command to update various roles (Locked/Unlocked, Experience, Event Specific)
- Added: ChastiKey Locktober command
- Removing: " " from CK commands where still present due to issues where users have different lang keyboards

  4.0.0

- Removed: Old command permissions system
- Removed: Large sections of old or disabled command code that was no longer being maintained or developed for several months
- Added: New command permissions system - now will be by permissions only when set
- Added: Info text if CK stats lockee fails some areas to check
- Added: 'Time Since Last Lock' value to CK lockee stats block
- Updated: Re-enabled DMs on as many commands as possible - will need to monitor for any issues on specific commands

  3.5.1

- Fixed: CK recover combos command
- Updating: CK endpoint for verify command

  3.5.0

- Added: !ck verify to verify Discord account to ChastiKey

  3.4.0

- Fixed: !util roles show range command to show the range specified
- Updated: !util role(s) commands, see help menu by typing !help util or !util role
- Updated: Rearranged !ck stats lockee cards remaining (when not hidden) to show in the same order as the CK app
- Added: Command !util role show NameHere (spaces can be omitted as they will be eliminated when looking up the role for better matching)
- Added: Command !util roles show like NameLike to filter and only show names like the passed string
- Added: Command to retrieve past CK unlocked combos via !ck recover combos
- Fixed: Issue in CK Stats lockee calculation in certain situations

  3.3.0

- Added: More stats + individual lock statistics to the !ck stats keyholder command
- Added: Command to toggle KH average locked time
- Added: Commands for Utils, Help menu to come

  3.2.5

- Updated: CK Stats lockee text to read Longest -> Longest (completed), Average Time Locked -> Average Time Locked (overall)

  3.2.4

- Fixed: CK stats lockee average calculation (factors current + past locks)

  3.2.3

- Added: Date first Key held to ck stats keyholder

  3.2.2

- Added: Proper yellow card with a ? for remaining cards in CK stats lockee command
- Updated: Keyholder for CK stats keyholder to have defaults for missing counts
- Updated: CK cards re-uploaded to save character space

  3.2.1

- Fixed: Average bug in CK stats lockee command

  3.2.0

- Logging changes for output
- Updated: CK logging
- Updated: CK Average is now calculated off of the calculated cumulative
- Added: CK Lock name
- Added: CK Lock cards required counts (if info is not hidden)

  3.1.0

- Improved: Removal of votes from Polls from DB
- Added: Poll commands to: Stop, Add Option, Remove Option,
- Added: More poll string responses
- Added: First BNet command: !wow..
- Updated: Some poll responses will now use DM instead of printing in channels to eliminate clutter
- Permissions check on command routing changed for Server Admins and future commands
- Adjusted & retired some admin commands

  3.0.0

- Updated: API to only return available notifications if server Id is present in lookup template
- Updated: API will now no longer return CK command permissions if server setting 'server.chastikey.enabled' is false (is by default)
- Updated: All CK commands are now set to default on new servers to disabled
- Added: First set of Poll commands (Web view coming soon!)

  2.12.0

- Implemented #8 - Removing tracking of username from TrackedMessage
- Added: Command to check user and bot permissions (!check permissions)
- Added: Stats Commands (top 10) lookup command (!stats commands)

  2.11.3

- Fixed: Extra condition where some CK locks showed status 'ReadyToUnlock' being skipped in calculation

  2.11.2

- Fixed: Decision rollers to recognize image URLs and show those as the embed block instead of just text
- Updated: Removed extra logging for 2.11.0-1 for debugging those changes, removing to improve performance

  2.11.1

- Fixed: !ck stats lockee cumulative accuracy algorithm to exclude locks that were: Locked, Deleted and Completed

  2.11.0

- Fixed: !ck stats lockee command will now try calculating the cumulative range instead for accuracy

  2.10.0

- Fixed: Audit log lookup output order
- Added: 8ball command

  2.9.0

- Command and Web Auth audit logging added

  2.8.3

- Fixed: OAuth issue where users who have no avatar set were getting blocked by validation

  2.8.2

- Fixed: Some commands not returning the correct final status for stats

  2.8.1

- Fixed: Refresh interval incorrect value

  2.8.0

- Added: Coin flip command
- Added: category to router interface & api call for permissions
- Added: example command into permissions api call
- Added: CK command to lookup lockees who have multiple KHs
- Added: CK command to display a keyholder's lockees
- Updated: CK Lockee stats lookup to block users with stats disabled

  2.7.1

- Fixing: CK Stats lockee lockedBy field presenting issues in newer dataset released
- Updated: Legacy permissions middleware

  2.7.0

- Cleaning up project commands code side
- Added: API Endpoint for deleting command permissions & updating user properties
- Added: Task to rebuild command permissions when any are missing
- Fixed: Command permissions duplication issue on boot causing duplication sometimes
- Fixed: CK Stats lockee bug introduced in 2.4.1 where it was always reducing cards drawn to 3 max
- Updated: API Permissions now sorted alphabetically by command name
- Updated: Runtimes on some background tasks

  2.6.0

- Added: On disabled command the Kiera will now DM the command author and inform
- Added: Background task to handle new channels missing permissions
- Changed: Background tasks to run/check every 30 seconds

  2.5.0

- Improvements to stats tracking and websocket heartbeat

  2.4.1

- Fixed: When user has > 5 active locks and how to handle card splicing to not hit char limits

  2.4.0

- Fixed: Server Settings for server owners in API
- Added: Command to adjust CK Ticker Rating display
- Updated: Both ck ticker and ck stats will show/hide the rating if set

  2.3.1

- Fixed: Notification override settings for server owners

  2.3.0

- Updated: Decision roll text and implementing new properties (author & server) from command
- Updated: API OAuth guilds that will be acknowledged to only those where Kiera is present
- Added: API & Server settings for server (guild) owners

  2.2.0

- Added: API endpoints for managing Decisions

  2.1.0

- Added: Base notifications support for Discord DMs
- Added: Notifications to Keyholder lookups

  2.0.1

- Fixed: Issue with non-Nitro Discord accounts not validating for web logins
- Fixed: Router permissions to once again accept DMs
- Updated: Removed CK Icon from Stats print to help with smaller screen sizes
- Updated: Removed excess space before Joined date on word wrap

  2.0.0

- API: Updates to support kierabot.xyz
- Fixed: !ck stats lockee snipping the wrong end of the card pile
- Fixed: !decision add command to now only allow owner to add items
- Added: CK Lockee & Keyholder stats Joined date

  1.3.3

- Updated: Debugging
- Updated: CK API Caching tasks & with a lower interval
- Updated: More values to store in DB for better settings controls

  1.3.2

- Fixed: CK Cache storage not happening
- Fixed: CK keyholder stats ratings display
- Added: Admin updates to help with general bot administration
- Added: CK stats lockee locks completed statistic

  1.3.1

- Added: new CK stats commands to help menu

  1.3.0

- Added: CK custom stats blocks for Lockees and Keyholders
- Added: CK ticker start date option
- Added: CK data caching added
- Updated: Help texts to only show available commands at this time
- Updated: Help texts to new embedded message format
- Updated: Database connectivity improvements

  1.2.0

- Added: Command failed fallback reply in chat to help show examples of command usage
- Added: Optional args support
- Added: Command !roll for rolling dice
- Updated Command: !decision to accept a question and outcomes without needing to save for quick usage
- Updated Command: !ck ticker to allow for a both type to be set (3) to return both tickers
- Updated Command: !ck ticker to accept a ticker type when using !ck ticker 2 to return the override type

  1.1.1

- Fix: new/reuse DB connection handling

  1.1.0

- Updating start scripts to remove rtail due to memory issue
- Added: Monitoring system for both the Bot's core functionality + DB Connectivity
- Preparing command permissions
- Preparing API endpoints for future kiera web portal

  1.0.1

- Documentation updates
  - Decision command added
  - Updating general command documentation
- Updated: CK middleware for 'is registered'
- Fixed: Validation/Args splitting on quotes
- Added CK error strings to help users with setup
