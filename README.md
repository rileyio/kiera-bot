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
> As of `9.0.0` the plan has been to move forward with new strings inside of commands once again vs in a localization file.
> If there is enough demand and support for re-enabling this feature and community translations then it could be revived.

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

Once the new web portal is live all commands and subcommands will be automatically generated and displayed.
Since the list that used to be here was so out of date i've chosen to just completely remove it from the Readme.
All available commands, subcommands and options have descriptions thanks to slash commands from within discord.