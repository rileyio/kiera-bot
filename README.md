## Project structure

```
app/*                - Compiled to directory (~ will get overwritten ~)
node_modules/*       - Dependencies
src/                 - All project code
├── api/             - WebAPI code
|   ├── controllers/ - (Web)API controllers
|   ├── utils/       - (Web) Utility methods/helpers
|   └── validations/ - (Web) Incoming data validation schemas
├── commands/        - All chat commands configurations & their controllers
├── db/              - Database storage controller
├── embedded/        - Chat Embedded blocks
├── lang/            - All language strings moving forward
├── middleware/      - Bot command middleware
├── objects/         - Defined objects used throughout the bot
├── permissions/     - Chat command permissions handling
├── tasks/           - Configured background tasks (jobs)
└── utils/           - Bot utility methods/helpers
```

## Commands for working on integration

To build (compile only):

> `yarn run clean && yarn run build`

To automatically build on saved changes to repo code (inside `/src`)

> `yarn run dev`

To start the application

> `yarn run start:nodebug` -or- for debug: `yarn run start`

Additional `terminal` and `powershell` debugging start scripts available!

## Env template

See .env-template at the root of the project directory

## Web Portal

All code for https://kierabot.xyz will be in https://github.com/rileyio/kiera-web

`kiera-web` makes use of the `kiera-bot` api for everything.

## API

`Further documentation coming soon.`

API Endpoint:

> URL: https://kierabot.xyz/api/

> Requires: AuthKey as header to authenticate

> Return Type: JSON

### Available

- method: `post` `/available/notifications`
- method: `post` `/available/settings`
- method: `post` `/available/user`
- method: `post` `/decisions`
- method: `delete` `/decision/delete`
- method: `post` `/decision/outcome/update`
- method: `delete` `/decision/outcome/delete`
- method: `post` `/decision/outcome/add`
- method: `post` `/lists`
- method: `post` `/notifications`
- method: `post` `/notification/update`
- method: `post` `/oauth`
- method: `post` `/permissions`
- method: `post` `/permissions/global/update`
- method: `post` `/permissions/allowed/update`
- method: `post` `/server/settings`
- method: `post` `/server/setting/update`
- method: `get` `/stats` - Returns (Object) all bot statistics
- method: `post` `/user`

## Commands

- BNet

  - `wow character us Stormreaver Jaydox` - Lookup WoW Character

- ChastiKey Specific

  - `ck verify` - Register/Verify account
  - `ck ticker` - Returns your ticker
  - `ck ticker #` - Returns a specific ticker type (replace #)
  - `ck ticker set type 2` - Set default ticker
  - `ck ticker set date 2019-01-27` - Start date for ticker data
  - `ck ticker set rating show` - To display rating or not show or hide
  - `ck stats lockee` - Get your lockee stats (by saved username)
  - `ck stats keyholder` - Get your keyholder stats (by saved username)
  - `ck stats lockee "Username"` - Get stats for defined username
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

- Decision Rollers

  - `decision "Question here!" "Answers" "here"` - Run a random decision (without saving)
  - `decision new "Your decision question here"` - Create a new saved decision (reusable)
  - `decision "DecisionID" add "New outcome here"` - Add options to saved decision
  - `decision roll 'DecisionID'` - Roll for a result from a saved decision

- General

  - `register` Registers the user with the bot

- Roll

  - `roll` - Roll a single die
  - `roll 20` - Roll a single die with 20 sides
  - `roll 10 6` - Roll multiple (10) dice with given number of sides (6)

- Poll
  - `poll new "Is Kiera the cat cute?"`
  - `poll edit 5cfcf44614e8a64034ca89f3 public false`
  - `poll start 5cfcf44614e8a64034ca89f3`
  - `poll stop 5cfcf44614e8a64034ca89f3`
  - `poll pick random 5cfcf44614e8a64034ca89f3 :thumbsup:`
  - `poll add option 5cfcf44614e8a64034ca89f3 :thumbsup: "Optional description here"`
  - `poll add option 5cfcf44614e8a64034ca89f3 :thumbsup:`
