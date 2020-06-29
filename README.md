# kiera-bot (A multi-use discord bot)

## Project structure

```md
app/                - Compiled to directory (~ will get overwritten ~)
locales/            - Internationalization and localization string files
logs/               - Logs directory
node_modules/       - Dependencies
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

## Commands for working on integration

To build (compile only):

> `npm run clean && npm run build`

To automatically build on saved changes to repo code (inside `/src`)

> `npm run dev`

To start the application (without pm2)

> `npm run start:nodebug` -or- for debug: `npm run start` -or- if using PowerShell, check the `package.json` scrips.

Additional `terminal` and `powershell` debugging start scripts available!

To start the application (with pm2)

> `pm2 start .\ecosystem.config.js`

## Env template

See .env-template at the root of the project directory

## Web Portal

All code for [kierabot.xyz](https://kierabot.xyz) will be at [rileyio/kiera-web](https://github.com/rileyio/kiera-web)

`kiera-web` makes use of the `kiera-bot` api for everything.

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
- `[post]` `/api/ck/keyholder`  
- `[post]` `/api/ck/lockee`  
- `[post]` `/api/ck/search`  
- `[post]` `/api/ck/user`  
- `[post]` `/api/ck/stats/locks`  
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

#### BNet

- `!wow character us stormreaver thejaydox` - Retrieve World of Warcraft character profile  
- `!d3 season current` - Retrieve current Diablo 3 Active Season  
- `!d3 profile BattleTag#1234` - Retrieve Diablo 3 user profile  

#### ChastiKey (3rd party service)

- `!ck recover combos 5` - Retrieve your completed lock combinations
- `!ck verify` - Link Discord account with ChastiKey App account
- `!ck role counts` - List of ChastiKey Discord Roles & statistics
- `!ck web` - Generate session for external Kiera + ChastiKey web portal
- `!ck debug UsernameHere` 
- `!ck lockee history` - Show lockee's history breakdown
- `!ck lockee nickname status always` 
- `!ck stats locktober` - ChastiKey Locktober event statistics
- `!ck search UsernameHere` - Search based off ChastiKey username
- `!ck stats lockee` - View Lockee stats
- `!ck stats keyholder UsernameHere` - View Keyholder stats
- `!ck check multilocked KeyHolderName` - List of Keyholder's lockees who have 2 or more Keyholders
- `!ck keyholder lockees` - List of Keyholder's lockees
- `!ck keyholder set average show` - Enable/Disable your rating visibility in stats commands
- `!ck ticker set type 2` - Set your default displayed ticker when you call the ticker command
- `!ck ticker set date 2019-01-27` - Set a start date for your ticker data
- `!ck ticker set rating show` - Enable/Disable your ticker & stats rating display
- `!ck ticker` - View ChastiKey Ticker
- `!ck update` - Sync your ChastiKey profile with Discord

#### Decision Rollers

- `!decision "id" unblacklist user "userSnowflake"` - Remove user from Decision's Blacklist  
- `!decision "id" blacklist user "userSnowflake"` - Add user to Decision's Blacklist  
- `!decision "id" blacklisted users` - List users on Decision's Blacklist  
- `!decision "id" unwhitelist server "serverID"` - Remove server from Decision's Server Whitelist  
- `!decision "id" whitelist server "serverID"` - Add server to Decision's Whitelist  
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

#### Fun
- `!8ball` - Ask a question, receive an answer  
- `!flip` - Flip a coin  
- `!roll` - Dice roller  

#### General

- `!register` Registers the user with the bot

#### Moderation

- `!mod mute emma#1366 "Reason is optional"` - Mute the given user
- `!mod unmute emma#1366` - Unmute the given user
- `!mod list muted` - Display a list of muted users
- `!mod lookup mute emma#1366` - Lookup a muted user

#### Poll
- `!poll new "Is Kiera the cat cute?"` - Create a new poll  
- `!poll edit 5cfcf44614e8a64034ca89f3 public false` - Edit poll settings (open, public, question, title, footer)  
- `!poll start 5cfcf44614e8a64034ca89f3` - Start accepting poll responses  
- `!poll stop 5cfcf44614e8a64034ca89f3` - Stop accepting poll responses  
- `!poll pick random 5cfcf44614e8a64034ca89f3 :thumbsup:` - Picks a random poll vote user  
- `!poll add option 5cfcf44614e8a64034ca89f3 :thumbsup: "Optional description here"` - Add a poll response option  
- `!poll add option 5cfcf44614e8a64034ca89f3 :thumbsup:` - Remove a poll response option  

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
- `!stats server` - View Statistics for Server  
- `!stats about` - About Statistics  
- `!stats disable user` - Disable your User Statistics collection  
- `!stats enable user` - Enable your User Statistics collection  
- `!stats delete user` - Delete your User Statistics collected  
- `!stats user` - View Statistics for User  