/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmbedBuilder, GuildMember, Interaction, TextChannel } from 'discord.js'
import { MessageRoute, RouteConfiguration, RoutedInteraction, RouterStats } from '../objects/router/'

import { Bot } from '@/index'
import { CommandPermission } from '../objects/permission'
import { Logger } from '@/utils'
import { ProcessedPermissions } from './route-permissions'
import { TrackedUser } from '@/objects/user/'

/**
 * The almighty incoming commands router!
 * @export
 * @class Router
 */
export class CommandRouter {
  public bot: Bot
  public routes: Array<MessageRoute> = []
  private log: Logger.Debug

  constructor(routes: Array<RouteConfiguration>, bot?: Bot) {
    this.bot = bot
    this.log = this.bot.Log.Router

    // Add routes that were loaded
    routes.forEach((r) => this.addRoute(r))
  }

  public async addRoute(route: RouteConfiguration) {
    if (this.routes.findIndex((r) => r.name === route.name) > -1) return this.bot.Log.Router.log(`!! Duplicate route name detected '${route.name}'`)
    this.routes.push(new MessageRoute(route))
    this.log.verbose(`🚏✔️ Route Added '${route.name}'`)
  }

  public async removeRoute(route: string | MessageRoute) {
    const routeIndex = this.routes.findIndex((r) => r.name === (typeof route === 'string' ? (route as string) : (route as MessageRoute).name))
    const routeFound = routeIndex > -1 ? this.routes[routeIndex] : undefined
    if (routeFound) {
      this.routes.splice(routeIndex, 1)
      await this.bot.reloadSlashCommands()
    }
    this.log.log(`🚏❌ Unloaded Route '${routeFound.name}'`)
  }

  /**
   * Process Routed Slash Command
   * @param _interaction
   * @returns
   */
  public async routeInteraction(_interaction: Interaction) {
    if (!_interaction.isCommand()) return // Hard block
    if (!_interaction.isChatInputCommand()) return

    this.bot.BotMonitor.LiveStatistics.increment('commands-seen')
    // if (!interaction.guild) {
    //   return interaction.reply('Kiera is only currently enabled inside of a Discord Server due to certain command limitations') // Hard block
    // }

    const { channel, commandName, guild, guildId, member, options, user } = _interaction
    const routerStats = new RouterStats(user)
    const route = this.routes.find((r) => r.name === commandName)

    // If no route matched, stop here
    if (!route) {
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
        where: 'Discord'
      })

      this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
      return // End here
    }

    this.bot.Log.Router.log(`Router -> Routing Command: ${route.name}`)

    // Lookup Kiera User in DB
    const kieraUser = new TrackedUser(await this.bot.DB.get('users', { id: user.id }))

    // Check if not stored - will be no Discord ID
    if (!kieraUser.id) kieraUser.__notStored = true

    // Normal routed behaviour
    const routed = new RoutedInteraction({
      author: user,
      bot: this.bot,
      channel: channel as TextChannel,
      guild,
      interaction: _interaction,
      isInteraction: true,
      member: member as GuildMember,
      options,
      route,
      routerStats: routerStats,
      user: kieraUser
    })

    // Process Permissions
    routed.permissions = await this.processPermissions(routed)
    this.bot.Log.Router.log('Router -> Permissions Check Results:', routed.permissions)

    if (!routed.permissions.pass) {
      if (routed.permissions.outcome === 'FailedServerOnlyRestriction') {
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
          where: 'Discord'
        })
        this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
      } else {
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
          where: 'Discord'
        })
      }

      return // Hard Stop
    }

    const mwareCount = Array.isArray(route.middleware) ? route.middleware.length : 0
    let mwareProcessed = 0

    // Process middleware
    for (const middleware of route.middleware) {
      const fromMiddleware = await middleware(routed)
      // If the returned item is empty stop here
      if (!fromMiddleware) {
        break
      }
      // When everything is ok, continue
      mwareProcessed += 1
    }

    this.bot.Log.Router.log(`Router -> Route middleware processed: ${mwareProcessed}/${mwareCount}`)

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
          where: 'Discord'
        })

        this.bot.BotMonitor.LiveStatistics.increment('commands-completed')
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
          where: 'Discord'
        })

        this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
      }
      return // End routing here
    }
    return
  }

  /**
   * Perform permissions check
   *
   * @private
   * @param {RoutedInteraction} routed
   * @returns
   * @memberof Router
   */
  private async processPermissions(routed: RoutedInteraction): Promise<ProcessedPermissions> {
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

    if (routed.route.permissions.nsfwRequired === true && routed.channel.isTextBased()) {
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
    if (routed.route.permissions.restrictedTo.length > 0) {
      if (routed.route.permissions.restrictedTo.findIndex((snowflake) => snowflake === routed.author.id) > -1) {
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
}
