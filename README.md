## Project structure

```
app/*                - Compiled to directory (~ will get overwritten ~)
node_modules/*       - Dependencies
src/                 - All project code
├── api/             - WebAPI code
|   ├── controllers/ - (Web)API controllers
|   ├── utils/       - (Web) Utility methods/helpers
|   └── validations/ - (Web) Incoming data validation schemas
├── db/              - Database/Message storage controllers
├── middleware/      - Bot command middleware
├── objects/         - Defined objects used throughout the bot
├── routes/          - All configured message command & react routes
└── utils/           - Bot utility methods/helpers
```


## Commands for working on integration

To build (compile only):

> `yarn run build`

To automatically build on saved changes to repo code (inside `/src`)

> `yarn run dev`

To start the application

> `yarn run start:nodebug` -or- for debug: `yarn run start`

Additional `terminal` and `powershell` debugging start scripts available!


## Additional notes (WIP)

General notes on running the application with the built in debug turned on to see
console output.


### Working on Windows

Example output: 
```ps
PS F:\GitHub\lovensediscordintegration> yarn run dev:ps
yarn run v1.10.1

$ @powershell -Command $env:DEBUG='ldi'; node ./app/index.js
  ldi just a test... getting things setup +0ms
Done in 0.79s.

PS F:\GitHub\lovensediscordintegration>
```


### Other platforms or CLIs

See [https://www.npmjs.com/package/debug] for the correct ENV commands


## Env template

See `.env-template` at the root of the project directory


## Bot Commands

Notes about commands:
- Times will always be in minutes
- User commands won't use any `@user#0000` arguments unless specified
- Keyholder commands must always specify a `@user#0000` if command is to target a user
- Commands listed as [x] are completed, [ ] are in progress or planned

### Admin
- [x] `!admin channel purge` Clears current channel of all messages (**Use Caution**)
- [x] `!admin user delete @user#0000` Removes a user record from the db
- [x] `!admin stats` Displays a breakdown of server tracked statistics & bot uptime
- [x] `!devices connected` View total count of connected devices
- [x] `!ping` Simple ping-pong with bot latency
- [x] `!version` Print the currently in use bot version (from `package.json`)

### Generic/Stats/Test Commands (Available to everyone)
- [x] **`!register`** Registers the user with the bot
- [x] **`!ck`** ChastiKey specific commands
  - [x] `!ck username YourUsername` Used to set your ChastiKey username 
  - [x] `!ck ticker` Using just this will return your configured ticker
  - [x] `!ck ticker set type #` Sets the ticker return type (`1` = Keyholder `2` = Lockee)
- [x] **`!help`** Displays a command help message block (sub block available: `!help ck`)
- [x] **`!user`**
  - [x] `!user key new` Generate an API key (needed for using the session with your device)
  - [x] `!user key destroy user:1:123abc` Deactivates your API key if needed

### Lockee Commands (Must be entered by the device owner)
> The following commands require a session: `!limit`

- [x] **`!limit`** Defines limits
  - [x] `!limit session time 120` Sets the user's hardlimit time (Default: `0` = none)
  - [x] `!limit session intensity 80` Sets the user's hardlimit intensity (Default: `0`)
- [x] **`!session`**
  - [x] `!session new type` Create a new session (Types available: `lovense`)
  - [x] `!session activate id` Activates your session (use ID provided from `!session new`)
  - [x] `!session deactivate id` Activates your session (use ID provided from `!session new`)
- [ ] **`!punishment`** *Coming soon*
- [ ] **`!task`** *Coming soon*

### Keyholder Commands
> The following commands require a session: `!react`, `!duration`

- [x] **`!react`** Define reaction paramters
  - [x] `!react @user#0000 time 5` Sets how much time to be calculated per react
- [x] **`!duration`** Define duration range of session, not setting will mean no limit
  - [x] `!duration @user#0000 min 10` Sets the time range of the session (reactions add to min)
- [ ] **`!punishment`** *Coming soon*
- [ ] **`!task`** *Coming soon*

- [ ] `!ma'amoverride` Let's ma'am override any setting `{MistressAlyona exclusive command}`


## API



## Available chat interactions (emotes)

:smile: = Low

:smirk: = Low-medium

:grimacing: = Medium

:sob: = Medium-high

:roll_eyes: = High