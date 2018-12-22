## Project structure

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

General notes on running the application with the built in debug turrned on to see
console output.


### Working on Windows

Example output: 
```ps
PS F:\GitHub\lovensediscordintegration> yarn run dev:ps
yarn run v1.10.1

$ @powershell -Command $env:DEBUG='lovense-discord-bot'; node ./app/index.js
  lovense-discord-bot just a test... getting things setup +0ms
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
DISCORD_TEST_CHANNEL=
BOT_MESSAGE_CLEANUP_CLEAR_CHANNEL=true
BOT_MESSAGE_CLEANUP_AGE=10000
BOT_MESSAGE_CLEANUP_INTERVAL=5000
```