import * as Discord from 'discord.js'
import * as Task from './tasks/index.ts'
import * as Utils from '#utils'

import { CommandRouter, Routed, routeLoader } from '#router/index'
import { RESTPostAPIApplicationCommandsJSONBody, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js'

import { Audit } from '#objects/audit'
import { BattleNet } from '#integrations/BNet'
import { BotMonitor } from './monitor.ts'
import { ChastiSafe } from '#integrations/ChastiSafe'
import Localization from './localization.ts'
import { MongoDB } from '#db'
import { PluginManager } from './plugin-manager.ts'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'
import { Secrets } from '#utils'
import { ServerStatisticType } from '#objects/statistics'
import { Statistics } from './statistics.ts'
import { StoredServer } from '#objects/server'
import debug from 'debug'
import { readFile } from 'fs/promises'

const DEFAULT_LOCALE = process.env.BOT_LOCALE
const Debugger = debug('kiera-bot')
Debugger.log = console.debug.bind(console)

export class Bot {
  public client: Discord.Client
  public Log = {
    API: new Utils.Logger.Debug('api'),
    Bot: new Utils.Logger.Debug('bot'),
    Command: new Utils.Logger.Debug('command'),
    Database: new Utils.Logger.Debug('database', { console: false }),
    Integration: new Utils.Logger.Debug('integration'),
    Plugin: new Utils.Logger.Debug('plugin'),
    Router: new Utils.Logger.Debug('command-router'),
    Scheduled: new Utils.Logger.Debug('scheduled')
  }
  public version: string
  public channel: { auditLog: Discord.TextChannel; announcementsChannel: Discord.TextChannel } = { announcementsChannel: null, auditLog: null }

  // Audit Manager
  public Audit: Audit

  // Service Monitors
  public BotMonitor: BotMonitor

  // Databases
  public DB: MongoDB

  // Plugins
  public Plugin: PluginManager

  // Background tasks v0-4
  public Task: Task.TaskManager

  // Bot msg router
  public Router: CommandRouter

  // API Services
  public Service: { BattleNet: BattleNet; ChastiSafe: ChastiSafe } = {
    BattleNet: null,
    ChastiSafe: new ChastiSafe(this)
  }

  // Statistics
  public Statistics: Statistics

  // Response Strings Renderer
  public Localization: Localization

  public async start() {
    const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }

    this.version = version
    this.Log.Bot.log(`initializing kiera-bot (${this.version})...`)

    ////////////////////////////////////////
    // Register bot services ///////////////
    ////////////////////////////////////////
    this.Audit = new Audit(this.DB)
    this.BotMonitor = new BotMonitor(this)
    this.DB = new MongoDB(this.Log.Database)
    this.Router = new CommandRouter(await routeLoader(this.Log.Router), this)
    this.Task = new Task.TaskManager(this)

    ////////////////////////////////////////
    // Plugin Manager //////////////////////
    ////////////////////////////////////////
    this.Plugin = new PluginManager(this)

    ////////////////////////////////////////
    // Bot Monitor - Sync //////////////////
    ////////////////////////////////////////
    await this.BotMonitor.start()

    ////////////////////////////////////////
    // Start Stats /////////////////////////
    ////////////////////////////////////////
    this.Statistics = new Statistics(this)

    ////////////////////////////////////////
    // Background Tasks ////////////////////
    ////////////////////////////////////////
    // Register background tasks
    this.Task.start([
      new Task.DBAgeCleanupScheduled(),
      new Task.ManagedUpdateScheduled(),
      new Task.StatusMessageRotatorScheduled()
      // new Task.StatsCleanerScheduled()
    ])

    ////////////////////////////////////////
    // Register 3rd party services /////////
    ////////////////////////////////////////
    // this.Service.BattleNet = new BattleNet()

    ////////////////////////////////////////
    // Setup API Services //////////////////
    ////////////////////////////////////////
    try {
      /// Integrations / Services / 3rd party
      // await this.Service.BattleNet.setup(this)
      await this.Service.ChastiSafe.setup()

      /// Reserved...
      /// ...
    } catch (error) {
      this.Log.Bot.error(`Error setting up a service!`, error)
    }

    ////////////////////////////////////////
    // Response Renderer ///////////////////
    ////////////////////////////////////////
    this.Localization = new Localization(this.Log.Bot)

    ////////////////////////////////////////
    // Print startup details ///////////////
    ////////////////////////////////////////
    this.Log.Bot.log(
      this.Localization.$render(DEFAULT_LOCALE, 'System.Startup', {
        commands: this.Router.routes.length,
        guilds: this.client.guilds.cache.size,
        langs: this.Localization.langs,
        nodeVersion: process.version,
        ping: this.BotMonitor.DBMonitor.pingTotalLatency / this.BotMonitor.DBMonitor.pingCount,
        routes: 0, //this.BotMonitor.WebAPI.configuredRoutes.length,
        strings: this.Localization.stringsCount,
        user: this.client.user.tag,
        users: await this.DB.count('users', {}),
        version: this.version
      })
    )

    // ==========================================================================================
    // => Start allowing incoming command routing from here down
    // ==========================================================================================

    /// Incoming message router (v8.0-beta-3 and newer commands) ///
    this.client.on('interactionCreate', async (int) => await this.onInteraction(int))
    ///Server connect/disconnect///
    this.client.on('guildCreate', async (guild) => this.onGuildCreate(guild))
    this.client.on('guildDelete', async (guild) => this.onGuildDelete(guild))
    this.client.on('guildUpdate', async (old: Discord.Guild, changed: Discord.Guild) => this.onGuildUpdate(old, changed))
    this.client.on('guildMemberAdd', (member) => this.onUserJoined(member))
    this.client.on('guildMemberRemove', (member) => this.onUserLeft(member))

    /// Update guilds info stored ///
    for (const guild of [...this.client.guilds.cache.values()]) {
      // Check if Guild info is cached
      this.Log.Bot.verbose('Guild Connection/Update in Servers Collection', guild.id)
      await this.DB.update(
        'servers',
        { id: guild.id },
        {
          $set: new StoredServer({
            id: guild.id,
            joinedTimestamp: guild.joinedTimestamp,
            lastSeen: Date.now(),
            name: guild.name,
            ownerID: guild.ownerId,
            type: 'discord'
          })
        },
        { atomic: true, upsert: true }
      )
    }
  }

  public async onReady() {
    try {
      const officialDiscord = await this.client.guilds.fetch(process.env.DISCORD_BOT_OFFICAL_DISCORD)
      // Setup Bot utilized channels
      this.channel.auditLog = officialDiscord.channels.cache.get(process.env.DISCORD_AUDITLOG_CHANNEL) as Discord.TextChannel
      this.channel.announcementsChannel = officialDiscord.channels.cache.get(process.env.DISCORD_ANNOUNCEMENTS_CHANNEL) as Discord.TextChannel
    } catch (error) {
      this.Log.Bot.error('Error fetching Official Discord.')
    }

    await this.reloadSlashCommands()
  }

  public async reloadSlashCommands() {
    // Stop a reload if command routes havent been generated, yet
    if (!this.Router) {
      this.Log.Bot.log('Router not ready, yet')
      return // Stop here
    }

    // Register Slash commands on Kiera's Development server
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = []
    for (const command of this.Router.routes.filter((c) => !c.permissions.optInReq)) command.slash ? commands.push(command.slash.toJSON()) : null
    const rest = new REST({ version: '10' }).setToken(Secrets.read('DISCORD_APP_TOKEN', this.Log.Bot))

    // Delete existing commands GLOBAL (Dev Only, should be blocked in production)
    // if (process.env.BOT_BLOCK_GLOBALSLASH === 'true') {
    //   try {
    //     await rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID), { body: [] })
    //     console.log('Successfully deleted all application commands.')
    //   } catch (error) {
    //     this.Log.Bot.error('Not Successful in deleting application commands.')
    //   }
    // }

    // Delete existing commands LOCAL (Dev Only, should be blocked in production)
    // if (process.env.BOT_BLOCK_GLOBALSLASH === 'true' && String(process.env.BOT_SERVERS_TO_PUSH || '').length) {
    //   const guildsToDeleteFrom = process.env.BOT_SERVERS_TO_PUSH.split(',')
    //   try {
    //     for (let index = 0; index < guildsToDeleteFrom.length; index++)
    //       await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, guildsToDeleteFrom[index]), { body: [] })
    //     console.log('Successfully deleted all application commands.')
    //   } catch (error) {
    //     this.Log.Bot.error('Not Successful in deleting application commands.')
    //   }
    // }

    try {
      this.Log.Bot.verbose('Started refreshing application (/) commands.')
      // ! Disabling ESLINT for the following line of code till shit gets fixed in the source libs
      if (process.env.BOT_BLOCK_GLOBALSLASH === 'true') {
        // Push manually a set to just Kiera's Development server
        // To have them available for testing immediately (+ any extra servers that are added)
        const guildsToUpdate = process.env.BOT_SERVERS_TO_PUSH.split(',')
        for (let index = 0; index < guildsToUpdate.length; index++) {
          const guild = guildsToUpdate[index]
          this.Log.Bot.verbose(`Started refreshing application (/) commands for guild ${guild}.`)
          await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, guild), { body: commands })
          this.Log.Bot.verbose(`Successfully reloaded application (/) commands for guild ${guild}.`)
        }
      }
      // Push normally
      else {
        // To global cache
        await rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID), { body: commands })
        this.Log.Bot.verbose('Successfully reloaded application (/) commands.')
      }
    } catch (error) {
      this.Log.Bot.error('Not Successful in updating Slash Commands', error.message)
    }
  }

  private async onInteraction(interaction: Discord.Interaction) {
    try {
      await this.Router.routeDiscordInteraction(interaction)
    } catch (error) {
      this.Log.Bot.error('Fatal onInteration error caught', error, interaction)
    }
  }

  private async onGuildCreate(guild: Discord.Guild) {
    this.Log.Bot.log(`Joined a new server: id: ${guild.id}, name: ${guild.name}`)

    // Save some info about the server in db
    await this.DB.update(
      'servers',
      { id: guild.id },
      {
        $set: new StoredServer({
          id: guild.id,
          joinedTimestamp: guild.joinedTimestamp,
          lastSeen: Date.now(),
          name: guild.name,
          ownerID: guild.ownerId,
          type: 'discord'
        })
      },
      { atomic: true, upsert: true }
    )
  }

  private async onGuildUpdate(old: Discord.Guild, changed: Discord.Guild) {
    this.Log.Bot.log(`Server Update Detected: id: ${old.id}, name: ${changed.name}`)

    // Save some info about the server in db
    await this.DB.update(
      'servers',
      { id: old.id },
      {
        $set: new StoredServer({
          id: old.id,
          joinedTimestamp: old.joinedTimestamp,
          lastSeen: Date.now(),
          name: changed.name,
          ownerID: changed.ownerId,
          type: 'discord'
        })
      },
      { atomic: true, upsert: true }
    )
  }

  private async onGuildDelete(guild: Discord.Guild) {
    await this.DB.remove('servers', { id: guild.id })
    this.Log.Bot.log('Left a guild: ' + guild.name)
  }

  private onUserJoined(member: Discord.GuildMember | Discord.PartialGuildMember) {
    this.Statistics.trackServerStatistic(member.guild.id, null, member.user.id, ServerStatisticType.UserJoined)
  }

  private onUserLeft(member: Discord.GuildMember | Discord.PartialGuildMember) {
    this.Statistics.trackServerStatistic(member.guild.id, null, member.user.id, ServerStatisticType.UserLeft)
  }
}

export { Plugin } from '#objects/plugin'
export { Routed }
