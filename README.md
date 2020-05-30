# kiera-bot (A multi-use discord bot)

## Project structure

```md
app/_ - Compiled to directory (~ will get overwritten ~)
node_modules/_ - Dependencies
src/ - All project code
├── api/ - WebAPI code
| ├── controllers/ - (Web)API controllers
| ├── utils/ - (Web) Utility methods/helpers
| └── validations/ - (Web) Incoming data validation schemas
├── commands/ - All chat commands configurations & their controllers
├── db/ - Database storage controller
├── embedded/ - Chat Embedded blocks
├── lang/ - All language strings moving forward
├── middleware/ - Bot command middleware
├── objects/ - Defined objects used throughout the bot
├── permissions/ - Chat command permissions handling
├── tasks/ - Configured background tasks (jobs)
└── utils/ - Bot utility methods/helpers
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
**Note: The API endpoints will continue to evolve through `v5.0`.**

> URL: <https://kierabot.xyz/api/>
> Requires: AuthKey as header to authenticate
> Return Type: JSON

### Available

- method: `post` `/api/audit`
- method: `post` `/api/otl`
- method: `post` `/api/session/verify`
- method: `post` `/api/available/settings`
- method: `post` `/api/available/user`
- method: `get` `/api/decisions`
- method: `patch` `/api/decision/name`
- method: `patch` `/api/decision/enabled`
- method: `put` `/api/decision/outcome`
- method: `patch` `/api/decision/outcome`
- method: `delete` `/api/decision/outcome`
- method: `put` `/api/decision`
- method: `delete` `/api/decision`
- method: `post` `/api/lists`
- method: `post` `/api/permissions`
- method: `post` `/api/permission/global/update`
- method: `delete` `/api/permission/global/delete`
- method: `post` `/api/permission/allowed/update`
- method: `post` `/api/server/settings`
- method: `post` `/api/server/setting/update`
- method: `get` `/api/stats`
- method: `post` `/api/user`
- method: `get` `/api/ck/keyholder`
- method: `post` `/api/ck/lockee`
- method: `post` `/api/ck/search`
- method: `post` `/api/ck/user`
- method: `post` `/api/ck/stats/locks`

## Commands

BNet

- `!wow character Region Server CharacterName` - Lookup WoW Character
- `!d3 season current` - Lookup WoW Character
- `!d3 profile BattleTag#1111` - Lookup WoW Character

ChastiKey Specific

- `!ck verify` - Register/Verify account
- `!ck web` - Opens the Kiera + ChastiKey specific web portal
- `!ck ticker` - Returns your ticker
- `!ck ticker #` - Returns a specific ticker type (replace #)
- `!ck ticker set type 2` - Set default ticker
- `!ck ticker set date 2019-01-27` - Start date for ticker data
- `!ck ticker set rating show` - To display rating or not show or hide
- `!ck stats lockee` - Get your lockee stats (by saved username)
- `!ck stats keyholder` - Get your keyholder stats (by saved username)
- `!ck stats lockee "Username"` - Get stats for defined username
- `!ck recover combos 5` - Returns past unlocked lock combinations
- `!ck update` - Performs a series of checks on the user's account and updates any discord roles
- `!ck role counts` - Stats to show distribution by roles
- `!ck debug UsernameHere` - Debugging tool for ChastiKey / Kiera accounts
- `!ck lockee history` - Returns Lockee History
- `!ck lockee history personal` - Returns a more detailed Lockee History
- `!ck stats locktober` - Show status of Locktober
- `!ck search UsernameHere` - Search usernames by string
- `!ck check multilocked KeyHolderName` - Check if any users are multilocked
- `!ck keyholder lockees KeyHolderName` - Prints a list of Lockees under you
- `!ck keyholder set average show` - Toggle your KH average in stats

Decision Rollers

- `!decision "Question here!" "Answers" "here"` - Run a random decision (without saving)
- `!decision new "Your decision question here"` - Create a new saved decision (reusable)
- `!decision "DecisionID" add "New outcome here"` - Add options to saved decision
- `!decision roll 'DecisionID'` - Roll for a result from a saved decision
- `!decision log DecisionID` - Display last 5 calls of this command and outcomes.

General

- `!register` Registers the user with the bot

Moderation

- `!mod mute emma#1366 "Reason is optional"` - Mute the given user
- `!mod unmute emma#1366` - Unmute the given user
- `!mod list muted` - Display a list of muted users
- `!mod lookup mute emma#1366` - Lookup a muted user

Roll

- `!roll` - Roll a single die
- `!roll 20` - Roll a single die with 20 sides
- `!roll 10 6` - Roll multiple (10) dice with given number of sides (6)

Poll

- `!poll new "Is Kiera the cat cute?"`
- `!poll edit 5cfcf44614e8a64034ca89f3 public false`
- `!poll start 5cfcf44614e8a64034ca89f3`
- `!poll stop 5cfcf44614e8a64034ca89f3`
- `!poll pick random 5cfcf44614e8a64034ca89f3 :thumbsup:`
- `!poll add option 5cfcf44614e8a64034ca89f3 :thumbsup: "Optional description here"`
- `!poll add option 5cfcf44614e8a64034ca89f3 :thumbsup:`
