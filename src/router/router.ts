/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmbedBuilder, GuildMember, Interaction, TextChannel } from 'discord.js'
import { RouteConfiguration, RouteConfigurationType, Routed, RouterStats } from '.'

import { Bot } from '@/index'
import { CommandPermission } from '@/objects/permission'
import { Routes as DiscRoutes } from 'discord-api-types/v10'
import { Logger } from '@/utils'
import { ProcessedPermissions } from '.'
import { REST } from '@discordjs/rest'
import { TrackedUser } from '@/objects/user/'
import { read as getSecret } from '@/secrets'

/**
 * The almighty incoming commands router!
 * @export
 * @class Router
 */
export class CommandRouter {
  public bot: Bot
  public routes: Array<RouteConfiguration<any>> = []
  private log: Logger.Debug

  constructor(routes: Array<RouteConfiguration<'placeolder-type'>>, bot?: Bot) {
    this.bot = bot
    this.log = this.bot.Log.Router

    // Add routes that were loaded
    routes.forEach(async (r) => await this.addRoute(r))
  }

  public async addRoute<T extends keyof RouteConfigurationType>(route: RouteConfiguration<T>, options?: { force?: boolean; loadNow?: boolean }) {
    const opts = Object.assign({ force: false, now: false }, options || {})

    // Watch for duplicate route names
    const foundIndex = this.routes.findIndex((r) => r.name === route.name)
    const foundDuplicate = foundIndex > -1

    // Duplicate route found, skip adding, warn, and stop here
    if (foundDuplicate && !opts.force) return this.log.warn(`!! Duplicate route name detected '${route.name}', skipping...`)

    // When Force is passed, remove the existig route
    if (foundDuplicate && opts.force) await this.removeRoute(this.routes[foundIndex])

    // Process route into its proper array
    this.processRouteAdd(route, opts.loadNow)
  }

  public async removeRoute<T extends keyof RouteConfigurationType>(route: string | RouteConfiguration<T>) {
    console.log('removing route', route)
    if (typeof route === 'string') this.log.warn(`[Deprecated] Router.removeRoute(string) is deprecated, use Router.removeRoute(RouteConfiguration) instead.`)
    const routeIndex = this.routes.findIndex((r) => (typeof route === 'string' ? r.name === route : r.name === route.name && r.type === route.type))
    const routeFound = routeIndex > -1 ? this.routes[routeIndex] : undefined

    // When route is not found, stop here
    if (!routeFound) return this.log.warn(`⚠ Route '${route}' not found, skipping removal...`)

    // Process route removal
    await this.processRouteRemove(routeFound)
  }

  /**
   * Process Routed Slash Command
   * @param interaction
   * @returns
   */
  public async routeDiscordInteraction(interaction: Interaction) {
    // Autocomplete handling
    if (interaction.isAutocomplete()) {
      const { commandName } = interaction
      console.log('Routing interaction autocomplete', commandName)

      // Find command route
      const route = this.routes.find((r) => r.name === commandName) as RouteConfiguration<'discord-chat-interaction'>

      // Missing route
      if (!route) return // Stop here

      // Ensure it has autocomplete options set for entire route
      if (route.autocomplete?.options === undefined) {
        console.warn('Route has no autocomplete options set')
        return // Stop here
      }

      // Get the focused option
      const focusedOption = interaction.options.getFocused(true)

      // Ensure the focused option has something defined
      if (route.autocomplete.options[focusedOption.name] === undefined) return // Stop here

      // Respond with autocomplete options
      const filtered = focusedOption.value
        ? route.autocomplete.options[focusedOption.name].filter((options) => options.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
        : route.autocomplete.options[focusedOption.name]
      console.log('filtered', filtered.length)
      return await interaction.respond(
        filtered.length > 20 ? [...filtered.slice(0, 20), { name: `...${filtered.length - 20} more, keep typing to refine results`, value: '...' }] : filtered
      )
    }

    if (!interaction.isCommand()) return // Hard block
    if (!interaction.isChatInputCommand()) return

    this.bot.BotMonitor.LiveStatistics.increment('commands-seen')

    const { channel, commandName, guild, guildId, member, options, type, user } = interaction
    const routerStats = new RouterStats(user)
    const route = this.routes.find((r) => r.name === commandName) as RouteConfiguration<'discord-chat-interaction'>

    // If no route matched, stop here
    if (!route) {
      this.log.debug(`Router -> No route found for command '${commandName}', type: '${type}'`)
      // Track in an audit event
      this.bot.Audit.NewEntry({
        error: 'Failed to process command',
        guild: {
          channel: channel.id,
          id: guildId,
          name: guild.name
        },
        name: 'command pre-routing',
        owner: user.id,
        runtime: routerStats.performance,
        successful: false,
        type: 'bot.command',
        where: 'discord'
      })

      this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
      return await interaction.reply({ content: `Unexpected Error, You're able to report this issue on https://github.com/rileyio/kiera-bot.`, ephemeral: true }) // ! End here
    }

    // Check if route is optInReq - if so, check if server is opted in
    if (route.permissions.optInReq) {
      const serverSettings = await this.bot.DB.verify('servers', {
        commandGroups: { [`command/discord/${route.category}`]: true },
        id: guildId,
        type: 'discord'
      })

      console.log('serverSettings', serverSettings)

      // Command must have been previously enabled and not deleted from cache
      if (!serverSettings) {
        // Track in an audit event
        this.bot.Audit.NewEntry({
          error: 'Command disabled by optInReq permission in this channel',
          guild: {
            channel: interaction.channel.isDMBased() ? 'DM' : interaction.channel.id,
            id: interaction.channel.isDMBased() ? 'DM' : interaction.guild.id,
            name: interaction.channel.isDMBased() ? 'DM' : interaction.guild.name
          },
          name: route.name,
          owner: interaction.user.id,
          runtime: routerStats.performance,
          successful: false,
          type: 'bot.command',
          where: 'discord'
        })
        this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
        return await interaction.reply({ content: 'There must be a settings conflict, because this command should not be available.', ephemeral: true }) // ! End here
      }
    }

    this.log.log(`Router -> Routing Command name: '${route.name}', type: '${route.type}'`)

    // Lookup Kiera User in DB
    const kieraUser = new TrackedUser(await this.bot.DB.get('users', { id: user.id }))

    // Check if not stored - will be no Discord ID
    if (!kieraUser.id) kieraUser.__notStored = true

    // Normal routed behaviour
    const routed = new Routed<'discord-chat-interaction'>({
      author: user,
      bot: this.bot,
      channel: channel as TextChannel,
      guild,
      interaction,
      member: member as GuildMember,
      options,
      route,
      routerStats,
      type: 'discord',
      user: kieraUser
    })

    // Process Permissions
    routed.permissions = await this.processPermissions(routed)
    this.log.log('Router -> Permissions Check Results:', routed.permissions)

    // Check if permissions check failed
    if (!routed.permissions.pass) {
      // Process depending on failure type
      if (routed.permissions.outcome === 'FailedServerOnlyRestriction') {
        this.log.verbose(`Router -> Command '${commandName}' is server only, but was used in a DM`)
        // Send message in response
        await routed.reply(routed.$render('Generic.Error.CommandDisabledInChannel', { command: commandName }), true)

        // Track in an audit event
        this.bot.Audit.NewEntry({
          error: 'Command disabled by permission in this channel',
          guild: {
            channel: routed.interaction.channel.isDMBased() ? 'DM' : routed.interaction.channel.id,
            id: routed.interaction.channel.isDMBased() ? 'DM' : routed.interaction.guild.id,
            name: routed.interaction.channel.isDMBased() ? 'DM' : routed.interaction.guild.name
          },
          name: routed.route.name,
          owner: routed.author.id,
          runtime: routerStats.performance,
          successful: false,
          type: 'bot.command',
          where: 'discord'
        })
        this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
        return // ! Hard Stop
      }

      // Fallback to generic failure tracking where permision check
      // failed for any other reason (from the previous type checks)
      this.log.verbose(`Router -> Command '${commandName}' is disabled by permissions`)
      await routed.reply('This command is restricted.', true)

      // Track in an audit event
      this.bot.Audit.NewEntry({
        error: 'Command disabled by permissions',
        guild: {
          channel: routed.interaction.channel.isDMBased() ? 'DM' : routed.interaction.channel.id,
          id: routed.interaction.channel.isDMBased() ? 'DM' : routed.interaction.guild.id,
          name: routed.interaction.channel.isDMBased() ? 'DM' : routed.interaction.guild.name
        },
        name: routed.route.name,
        owner: routed.author.id,
        runtime: routerStats.performance,
        successful: false,
        type: 'bot.command',
        where: 'discord'
      })

      return // ! Hard Stop
    }

    // Process Middleware
    const mwareCount = Array.isArray(route.middleware) ? route.middleware.length : 0
    let mwareProcessed = 0

    // Process middleware (if any)
    if (route.middleware)
      for (const middleware of route.middleware) {
        const fromMiddleware = await middleware(routed)
        // If the returned item is empty stop here
        if (!fromMiddleware) {
          break
        }
        // When everything is ok, continue
        mwareProcessed += 1
      }

    this.log.log(`Router -> Route middleware processed: ${mwareProcessed}/${mwareCount}`)

    // Stop execution of route if middleware is completed
    if (mwareProcessed === mwareCount) {
      this.bot.BotMonitor.LiveStatistics.increment('commands-routed')
      const status = route.plugin ? await route.controller(route.plugin, routed) : await route.controller(routed)

      // Successful completion of command
      if (status) {
        // Track in an audit event
        this.bot.Audit.NewEntry({
          guild: routed.channel.isDMBased()
            ? {
                channel: 'dm',
                id: 'dm',
                name: 'dm'
              }
            : {
                channel: channel.id,
                id: routed.guild.id,
                name: routed.guild.name
              },
          name: routed.route.name,
          owner: routed.author.id,
          runtime: routerStats.performance,
          successful: true,
          type: 'bot.command',
          where: 'discord'
        })

        this.bot.BotMonitor.LiveStatistics.increment('commands-completed')
        return // End routing here
      }
      // Command failed or returned false inside controller
      else {
        // Track in an audit event
        this.bot.Audit.NewEntry({
          error: 'Command failed or returned false inside controller',
          guild: {
            channel: channel.id,
            id: routed.guild.id,
            name: routed.guild.name
          },
          name: routed.route.name,
          owner: routed.author.id,
          runtime: routerStats.performance,
          successful: false,
          type: 'bot.command',
          where: 'discord'
        })

        this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
        return // End routing here
      }
    }
  }

  /**
   * Perform permissions check
   *
   * @private
   * @param {Routed} routed
   * @returns
   * @memberof Router
   */
  private async processPermissions(routed: Routed<'discord-chat-interaction'>): Promise<ProcessedPermissions> {
    const checks: ProcessedPermissions = {
      // Permissions of user
      hasAdministrator: !routed.channel.isDMBased() ? routed.member.permissions.has('Administrator') : false,
      hasManageChannel: !routed.channel.isDMBased() ? routed.member.permissionsIn(routed.channel.id).has('ManageChannels') : false,
      hasManageGuild: !routed.channel.isDMBased() ? routed.member.permissions.has('ManageGuild') : false
    }

    // [IF: serverOnly is set] Command is clearly meant for only servers
    if (routed.route.permissions.serverOnly === true && routed.channel.isDMBased()) {
      checks.outcome = 'FailedServerOnlyRestriction'
      checks.pass = false
      return checks // Hard stop here
    }

    if (routed.route.permissions.nsfwRequired === true) {
      // [IF: nsfwRequired is set] Command can only respond in NSFW channels
      const channel = routed.channel as TextChannel
      if (!channel.nsfw) {
        console.log('Failed NSFW check')
        checks.outcome = 'FailedNSFWRestriction'
        checks.pass = false
        // Notify user that channel is not NSFW
        await routed.reply(
          {
            embeds: [
              new EmbedBuilder()
                .setColor(15548997)
                .setTitle('Channel is not NSFW')
                .setDescription('This command may only be used in a NSFW channel.')
                .setFooter({
                  iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
                  text: 'Notice from Kiera'
                })
                .setTimestamp(Date.now())
            ]
          },
          true
        )
        return checks // Hard stop here
      }
    }

    // [IF: Required user ID] Verify that the user calling is allowd to access (mostly legacy commands)
    if (routed.route.permissions.hasLegacyServerRestriction) {
      if (routed.route.permissions.restrictedToUser.findIndex((snowflake) => snowflake === routed.author.id) > -1) {
        checks.outcome = 'Pass'
        checks.pass = true
        return checks // stop here
      } else {
        checks.outcome = 'FailedIDCheck'
        checks.pass = false
        return checks // Hard stop here
      }
    }

    // [IF: Required Server Admin] Verify is the user a server admin if command requires it
    if (routed.route.permissions.serverAdminOnly) {
      // [FAIL: Admin]
      if (!checks.hasAdministrator) {
        checks.outcome = 'FailedAdmin'
        checks.pass = false
        return checks // Hard stop here
      }
    }

    // [IF: Required Manage Channel] Verify is the user a channel admin if command requires it
    if (routed.route.permissions.manageChannelReq) {
      // [FAIL: Admin]
      if (!checks.hasManageChannel) {
        checks.outcome = 'FailedManageChannel'
        checks.pass = false
        return checks // Hard stop here
      }
    }

    // Skip if a DM, as no one would have set a permission for a channel for this
    // Get the command permission if its in the DB
    const commandPermission = new CommandPermission(
      (await routed.bot.DB.get('command-permissions', {
        channelID: !routed.channel.isDMBased() ? routed.channel.id : 'DM',
        command: routed.route.name,
        serverID: !routed.channel.isDMBased() ? routed.guild.id : 'DM'
      })) || {
        channelID: routed.channel.id,
        command: routed.route.name,
        enabled: true,
        // Defaults to True
        serverID: !routed.channel.isDMBased() ? routed.guild.id : 'DM'
      }
    )

    // Some how if it gets here without a permission constructed then just block the command from running
    if (!commandPermission) {
      checks.outcome = 'FailedPermissionsCheck'
      checks.pass = false
      return checks // Stop here
    }

    if (commandPermission.isAllowed()) {
      checks.outcome = 'Pass'
      checks.pass = true
      return checks
    }

    // Fallback - Fail
    checks.outcome = 'FailedPermissionsCheck'
    checks.pass = false
    return checks
  }

  private async processRouteAdd(route: RouteConfiguration<any>, loadNow?: boolean) {
    try {
      // Add to router array
      this.routes.push(new RouteConfiguration(route))

      // --------------------------------------------------
      // [IF: Route is for discord] do Discord things
      // --------------------------------------------------
      if (route.type === 'discord-chat-interaction' && loadNow) {
        // Get some things ready
        const rest = new REST({ version: '10' }).setToken(getSecret('DISCORD_APP_TOKEN', this.bot.Log.Bot))
        // Add global command
        await rest.post(DiscRoutes.applicationCommands(process.env.DISCORD_APP_ID), { body: route.discordRegisterPayload() })
      }

      this.log.verbose(`🚏✔️ Route Added '${route.name}'`)
    } catch (error) {
      this.log.error(`🚏❌ Failed to add route '${route.name}'`, error)
    }
  }

  private async processRouteRemove(route: RouteConfiguration<any>) {
    try {
      // --------------------------------------------------
      // [IF: Route is for discord] do Discord things
      // --------------------------------------------------
      // Clone the route for removal processing
      // const routeFound = new RouteConfiguration(JSON.parse(JSON.stringify(route)))
      const routeFound = new RouteConfiguration(JSON.parse(JSON.stringify(route)))
      if (routeFound.type === 'discord-chat-interaction') {
        // Get some things ready
        const rest = new REST({ version: '10' }).setToken(getSecret('DISCORD_APP_TOKEN', this.bot.Log.Bot))
        // Get Global command ID
        const commands = await this.bot.client.application.commands.fetch()
        const commandID = commands?.find((c) => c.name === routeFound.name)?.id
        // Remove global command
        await rest.delete(DiscRoutes.applicationCommand(process.env.DISCORD_APP_ID, commandID))
        // Remove route from router array
        this.routes.splice(
          this.routes.findIndex((r) => r.name === routeFound.name && r.type === routeFound.type),
          1
        )
        this.log.log(`🚏🗑 Unloaded Discord Global Route '${routeFound.name}'`)
      }
    } catch (error) {
      this.log.error(`🚏❌ Failed to unload Discord Global Command: '${route.name}'`, error)
    }
  }
}
