# kiera-bot (A multi-use discord bot)

## Project structure

```md
app/                - Compiled to directory (~ will get overwritten ~)
locales/            - Internationalization and localization string files
logs/               - Logs directory
secrets/            - Docker Secrets (>= 9.0.0)
src/                - All project code
├── api/            - (Web)API code
| ├── controllers/  - (Web)API controllers
| ├── middleware/   - (Web)API specific middleware
| ├── router/       - (Web)API request router
| ├── router/       - (Web)API web socket emits
| ├── utils/        - (Web)API Utility methods/helpers
| └── validations/  - (Web) Incoming data validation schemas
├── commands/       - All chat commands configurations & their controllers
├── db/             - Database setup and access methods
├── embedded/       - Chat Embedded message builders/blocks
├── lang/           - (Legacy) Internationalization and localization
├── middleware/     - Bot command middleware
├── objects/        - Defined objects used throughout the bot
├── router/         - Chat command router
├── tasks/          - Configured background tasks (jobs)
├── typings/        - TS Typings where projects have none
└── utils/          - Bot utility methods/helpers

*──                 - Primary files to startup bot & core functionality only
```

## Commands for development & compiling 

> `>= 9.0.0` pm2 support has been removed

> `>= 9.0.0` Certain secret/sensitive values have been removed from the `.env` file, see Prereqs

### Prereqs

1. Make a `secrets/` directory and populate with any relevant secret declared environment values. Notes as to which have moves are listed in the `.env-template`.
2. Ensure you complete the non-secret declared values and rename/copy `.env-template` to `.env`.


### Development Mode (w/Hot Reloading)

To run in development mode with hot reloading simply run:

`make up`


### Production Mode

To run in production mode run:

`make up prod`

## Web Portal

All code for [kierabot.xyz](https://kierabot.xyz) will be at [rileyio/kiera-web](https://github.com/rileyio/kiera-web)  
`kiera-web` makes use of the `kiera-bot` api for everything.

## Localization
> `9.0.0` Rework needing planned.

Starting in Kiera `v6` there is now Localization support.  
All strings are managed on [POEditor](https://kierabot.xyz/translate)  

Current Progress (Languages in focus where translations are being used):  
- English `[100%]` `(Source)`
- Dutch `[92%]`
- French `[65%]`
- German `[92%]`

> **Note:** This is not an exhaustive list of languages under review. 
> Locales are generally included after they've reached the> `>=50%` completed mark. 
> Some languages may require further review before inclusion.

## API

**API Endpoint:**

- URL: <https://kierabot.xyz/api/>  
- Requires: AuthKey as header to authenticate  
- Return Type: JSON  

### Available

- `[post]` `/api/audit`  
- `[post]` `/api/available/settings`  
- `[post]` `/api/available/user`  
- `[post]` `/api/lists`  
- `[post]` `/api/permissions`  
- `[post]` `/api/permission/global/update`  
- `[post]` `/api/permission/allowed/update`  
- `[delete]` `/api/permission/global/delete`  
- `[post]` `/api/server/settings`  
- `[post]` `/api/server/setting/update`  
- `[get]` `/api/stats`  
- `[post]` `/api/decision`  
- `[get]` `/api/decisions`  
- `[patch]` `/api/decision/props`  
- `[put]` `/api/decision/outcome`  
- `[patch]` `/api/decision/outcome`  
- `[delete]` `/api/decision/outcome`  
- `[put]` `/api/decision`  
- `[delete]` `/api/decision`  
- `[patch]` `/api/decision/consumedReset`  
- `[get]` `/api/user/mydata/totals`  
- `[post]` `/api/web/oauth`  
- `[post]` `/api/web/verify`  
- `[post]` `/api/web/logout`  
- `[post]` `/api/otl`  
- `[post]` `/api/session/verify`  

## Commands

> **[>= v8.0]** Bolded commands have been converted to slash commands.

> This section is out of date as of 9.0 and will need updated to reflect the new slash commands.

#### Admin

- `!admin channel purge` - [**Restricted:** Server Admin] Purge all messages in channel  
- `!admin commands` - [**Restricted:** Server Admin] Retrieve list of command categories  
- `!admin category Fun` - [**Restricted:** Server Admin] Retrieve list of categories commands  
- `!admin restrict command 8ball` - [**Restricted:** Server Admin] Restrict Command usage **(Under Dev)**  
- `!admin stats` - [**Restricted:** Server Admin] Bot running stats
- `!admin prefix use /` - Used to set a custom prefix for Kiera on server. (Replace `/` with desired prefix)
- `!check permissions` - Check Yours and Kiera's permissions
- `!ping` - Check Kiera's Ping/Latency
- `!restart bot` - [**Restricted:** Pre-defined users] Restart Kiera Bot application
- **`/version` - Display current Kiera version**

#### BNet

- `!wow character us stormreaver thejaydox` - Retrieve World of Warcraft character profile  
- `!d3 season current` - Retrieve current Diablo 3 Active Season  
- `!d3 profile BattleTag#1234` - Retrieve Diablo 3 user profile  

#### Decision Rollers

- `!decision "id" unblacklist user "userSnowflake"` - Remove user from Decision's Blacklist  
- `!decision "id" blacklist user "userSnowflake"` - Add user to Decision's Blacklist  
- `!decision "id" blacklisted users` - List users on Decision's Blacklist  
- `!decision "id" unwhitelist server "serverID"` - Remove server from Decision's Server Whitelist  
- `!decision "id" whitelist server "serverID"` - Add server to Decision's Whitelist  
- `!decision nickname 5c68835bc5b65b2113c7ac7b "nickname-here"` - Set a custom nickname for a Decision roll  
- `!decision user nickname NicknameHere` - Set a custom User nickname to prefix Decision rolls
- `!decision log id` - Fetch the last 5 decision log entries  
- `!decision new "name"` - Create new Decision roll  
- `!decision "id" manager add @user#1234` - Add user as a Manager of the Decision roll's properties  
- `!decision "id" manager remove @user#1234` - Remove user as a Manager from the Decision roll  
- `!decision "id" ownership transfer @user#1234` - Transfer ownership of Decision roll  
- `!decision "id" outcome add "Your decision entry here"` - Add new outcome to Decision roll  
- `!decision "id" consume mode 0` - Set consume mode for Decision roll  
- `!decision "id" consume reset 0` - Set reset frequency (in seconds) of consumed Decision outcomes  
- `!decision "oldID" new id` - Create a new Decision unique ID for your roll  
- `!decision roll "id"` - Roll premade Decision  
- `!decision "Question here" "Option 1" "Option 2" "etc.."` - Create & Roll a 1 time Decision roll  
- `/decision list` - List of Owned and Managed Decision Rollers

#### Fun
- `!8ball` - Ask a question, receive an answer  
- `!flip` - Flip a coin  
- **`/roll` - Dice roller**  

#### General

- **`/register` Registers the user with the bot**  

#### Managed Channels

- **`/managed create` - Creates a Managed Channel to display a countdown**  

#### Moderation

- `!mod list muted` - Display a list of muted users
- `!mod lookup mute emma#1366` - Lookup a muted user
- `!mod mute emma#1366 "Reason is optional"` - Mute the given user
- `!mod unmute emma#1366` - Unmute the given user

#### Stats
- `!stats commands` - Statistics about most run commands  
- `!stats disable channel` - View Statistics for Server  
- `!stats enable channel` - Enable Channel Statistics collection  
- `!stats delete channel` - Delete your User Statistics collected  
- `!stats channel` - View Statistics for Channel  
- `!stats disable server` - Disable Server Statistics collection  
- `!stats enable server` - Enable Server Statistics collection  
- `!stats delete server` - Delete Server Statistics collected  
- `!stats top channels` - View top channels on server by Statistics  
- **`/stats server` - View Statistics for Server**  
- **`/stats about` - About Statistics**  
- `!stats disable user` - Disable your User Statistics collection  
- `!stats enable user` - Enable your User Statistics collection  
- `!stats delete user` - Delete your User Statistics collected  
- `!stats user` - View Statistics for User  