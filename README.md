I .03
00202## Project structure

```
app/ - Compiled to directory (~ will get overwritten ~)
node_modules/ - Included packages
src/ - All project code
```

## Commands for working on integration

To build (compile only):

> `yarn run build`

To build upon changes to repo code (inside `/src`)

> `yarn run dev`

To start the application

> `yarn run start` -or- `node ./app/index.js`

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
```sh
# API Keys
#########################
LOVENSE_API_KEY=
 
DISCORD_APP_NAME=lovense-discord-integration
DISCORD_APP_ID=
DISCORD_APP_SECRET=
DISCORD_APP_TOKEN=


CALLBACK_URI=http://localhost:8080/

# Bot settings
#########################
DISCORD_TEST_CHANNEL=526038295726129162
BOT_MESSAGE_CLEANUP_CLEAR_CHANNEL=false
BOT_MESSAGE_CLEANUP_AGE=10000
BOT_MESSAGE_CLEANUP_MEMORY_AGE=20000
BOT_MESSAGE_CLEANUP_INTERVAL=5000
BOT_MESSAGE_PREFIX=!

# Database Config
#########################
DB_HOST=
DB_PORT=
DB_NAME=ldi
DB_USER=ldi-bot
DB_PASS=
```


## Bot Commands

Notes about commands:
- Times will always be in minutes
- User commands won't use any `@user#0000` arguments unless specified
- Keyholder commands must always specify a `@user#0000` if command is to target a user
- Commands listed as [x] are completed, [ ] are in progress or planned

### Generic/Stats/Test Commands (Available to everyone)
- [ ] `!register` Registers the user with the bot
- [x] `!version` Gets the bot's current version
- [x] `!devices` Requires additional args
  - [x] `connected` View total count of connected devices
- [x] `!ck`
  - [x] `username YourUsername` Used to set your ChastiKey username 
  - [x] `ticker` Using just this will return your configured ticker
    - [x] `set type` `1` = Keyholder `2` = Lockee

### Lockee Commands (Must be entered by the device owner)
- [ ] `!limit` Defines limits
  - [ ] `time` `1-120`
  - [ ] `intensity`

### Keyholder Commands

> **Reminder:** Keyholder commands must include a user `!react @emma#1366 time 5`

- [ ] `!react @user#0000`
  - [ ] `time` `1-10` sets how much time to be added/removed per react
- [ ] `!duration @user#0000`
  - [ ] `time` `1-120` sets a duration (`!react time #` can add to this)
- [ ] `!intensity`
  - [ ] `set`
    - [ ] `min` `0-100`
    - [ ] `max` `0-100`

- [ ] `!ma'amoverride` Let's ma'am override any setting `{MistressAlyona exclusive command}`


## Available chat interactions (emotes)

:smile: = Low

:smirk: = Low-medium

:grimacing: = Medium

:sob: = Medium-high

:roll_eyes: = High
