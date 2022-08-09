import { ChannelType, GuildMember, Interaction, Message, TextChannel, User } from 'discord.js'
import { MessageRoute, RouteConfiguration, RouterRouted, RouterStats } from '../objects/router/'

import { Bot } from '@/index'
import { CommandPermission } from '../objects/permission'
import { ProcessedPermissions } from './route-permissions'
import { ServerStatisticType } from '../objects/statistics'
import { TrackedMessage } from '../objects/message'
import { TrackedUser } from '@/objects/user/'

/**
 * The almighty incoming commands router!
 * @export
 * @class Router
 */
export class CommandRouter {
  public bot: Bot
  public routes: Array<MessageRoute>

  constructor(routes: Array<RouteConfiguration>, bot?: Bot) {
    this.bot = bot
    // Alert if duplicate route name is detected
    const _dupRouteCheck = {}
    routes.forEach((r) => {
      if (_dupRouteCheck[r.name] !== undefined) this.bot.Log.Router.log(`!! Duplicate route name detected ${r.name}`)
      else _dupRouteCheck[r.name] = 1
    })

    this.routes = routes.map((r) => new MessageRoute(r))
    // this.bot.Log.Router.log(`routes configured = ${this.routes.filter((r) => r.type === 'message').length}`)
    // this.bot.Log.Router.log(`reacts configured = ${this.routes.filter((r) => r.type === 'reaction').length}`)
  }

  /**
   * Route incoming Reaction Event
   *
   * @param {Message} message
   * @param {string} reaction
   * @param {User} user
   * @param {('added' | 'removed')} direction
   * @returns
   * @memberof Router
   */
  public async routeReaction(message: Message, reaction: string, user: User, direction: 'added' | 'removed') {
    const routerStats = new RouterStats(message.author)
    // Debug value set in .env
    if (process.env.BOT_BLOCK_REACTS === 'true') return // Should be set if 2 instances of bot are running
    // console.log('user', user)
    this.bot.Log.Router.log(`Router -> incoming reaction <@${user.id}> reaction:${reaction} ${direction}`)
    // console.log('reaction', reaction)
    // Block my own messages
    if (user.id === this.bot.client.user.id) {
      // Track my own messages when they are seen
      // this.bot.BotMonitor.LiveStatistics.increment('messages-sent')
      // Track if its a dm as well
      if (message.channel.type === ChannelType.DM) {
        // this.bot.BotMonitor.LiveStatistics.increment('dms-sent')
      }
      return // Hard block
    } else {
      if (direction === 'added' && user.bot === false) {
        // Track stats
        this.bot.Statistics.trackServerStatistic(message.guild.id, message.channel.id, user.id, ServerStatisticType.Reaction)
      }
    }

    // Lookup tracked message in db
    let storedMessage = await this.bot.DB.get('messages', { id: message.id })

    // Stop routing if no message is tracked
    if (!storedMessage) return

    // Init stored message
    storedMessage = new TrackedMessage(storedMessage)

    // Update stored record if it gets this far with any react changes
    // console.log('router sees:', message.reactions.cache.array())
    storedMessage.update('reactions', [...message.reactions.cache.values()])
    await this.bot.DB.update('messages', { _id: storedMessage._id }, storedMessage)

    // Ensure stored message has a route name to properly route it
    if (!storedMessage.reactionRoute) return

    // Find route to send this message reaction upon
    const route = this.routes.find((r) => {
      return r.name === storedMessage.reactionRoute && r.type === 'reaction'
    })
    this.bot.Log.Router.log('Router -> Route:', route)

    // Stop routing if no route match
    if (!route) return

    // Lookup Kiera User in DB
    const kieraUser = new TrackedUser(await this.bot.DB.get('users', { id: user.id }))

    // Check if not stored - will be no Discord ID
    if (!kieraUser.id) kieraUser.__notStored = true

    const routed = new RouterRouted({
      author: user,
      bot: this.bot,
      channel: message.channel as TextChannel,
      guild: message.guild,
      member: message.member,
      message: message,
      reaction: {
        reaction: reaction,
        snowflake: user.id
      },
      route: route,
      routerStats: routerStats,
      state: direction,
      trackedMessage: storedMessage,
      type: 'reaction',
      user: kieraUser
    })

    // Process middleware
    const mwareCount = Array.isArray(route.middleware) ? route.middleware.length : 0
    let mwareProcessed = 0

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

    // Stop execution of route if middleware is halted
    if (mwareProcessed === mwareCount) {
      // this.bot.BotMonitor.LiveStatistics.increment('commands-routed')
      // Check status returns later for stats tracking
      try {
        await route.controller(routed)
      } catch (error) {
        this.bot.Log.Router.error('Router -> Failed to fully execute controller, error:', error)
      }
      // this.bot.BotMonitor.LiveStatistics.increment('commands-completed')
      return // End routing here
    }
  }

  /**
   * Process Routed Slash Command
   * @param interaction
   * @returns
   */
  public async routeInteraction(interaction: Interaction) {
    if (!interaction.isCommand()) return // Hard block
    const { channel, commandName, guild, guildId, member, user } = interaction
    const routerStats = new RouterStats(user)
    const route = this.routes.find((r) => r.name === commandName)

    // If no route matched, stop here
    if (!route) {
      this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
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

      return // End here
    }

    this.bot.Log.Router.log(`Router -> Routing Command: ${route.name}`)

    // Lookup Kiera User in DB
    const kieraUser = new TrackedUser(await this.bot.DB.get('users', { id: user.id }))

    // Check if not stored - will be no Discord ID
    if (!kieraUser.id) kieraUser.__notStored = true

    // Normal routed behaviour
    const routed: RouterRouted = new RouterRouted({
      author: user,
      bot: this.bot,
      channel: channel as TextChannel,
      guild,
      interaction,
      isInteraction: true,
      member: member as GuildMember,
      route,
      routerStats: routerStats,
      type: route.type,
      user: kieraUser
    })

    // Process Permissions
    routed.permissions = await this.processPermissions(routed)
    this.bot.Log.Router.log('Router -> Permissions Check Results:', routed.permissions)

    if (!routed.permissions.pass) {
      this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')

      if (routed.permissions.outcome === 'FailedServerOnlyRestriction') {
        // Send message in response
        await routed.reply(routed.$render('Generic.Error.CommandDisabledInChannel', { command: commandName }), true)

        // Track in an audit event
        this.bot.Audit.NewEntry({
          error: 'Command disabled by permission in this channel',
          guild: {
            channel: 'DM',
            id: 'DM',
            name: 'DM'
          },
          name: routed.route.name,
          owner: routed.author.id,
          runtime: routerStats.performance,
          successful: false,
          type: 'bot.command',
          where: 'Discord'
        })
      } else {
        // Track in an audit event
        this.bot.Audit.NewEntry({
          error: 'Command disabled by permissions',
          guild: {
            channel: channel.id,
            id: routed.message.guild.id,
            name: routed.message.guild.name
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
      const status = await route.controller(routed)
      // Successful completion of command
      if (status) {
        this.bot.BotMonitor.LiveStatistics.increment('commands-completed')
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
      }
      // Command failed or returned false inside controller
      else {
        this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
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
      }
      return // End routing here
    }

    this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
    return
  }

  /**
   * Perform permissions check
   *
   * @private
   * @param {RouterRouted} routed
   * @returns
   * @memberof Router
   */
  private async processPermissions(routed: RouterRouted): Promise<ProcessedPermissions> {
    const checks: ProcessedPermissions = {
      // Permissions of user
      hasAdministrator: !routed.channel.isDMBased ? routed.member.permissions.has('Administrator') : false,
      hasManageChannel: !routed.channel.isDMBased ? routed.member.permissionsIn(routed.channel.id).has('ManageChannels') : false,
      hasManageGuild: !routed.channel.isDMBased ? routed.member.permissions.has('ManageGuild') : false
    }

    // [IF: serverOnly is set] Command is clearly meant for only servers
    if (routed.route.permissions.serverOnly === true && routed.channel.isDMBased) {
      checks.outcome = 'FailedServerOnlyRestriction'
      checks.pass = false
      return checks // Hard stop here
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
        channelID: !routed.channel.isDMBased ? routed.channel.id : 'DM',
        command: routed.route.name,
        serverID: !routed.channel.isDMBased ? routed.guild.id : 'DM'
      })) || {
        channelID: routed.channel.id,
        command: routed.route.name,
        enabled: true,
        // Defaults to True
        serverID: !routed.channel.isDMBased ? routed.guild.id : 'DM'
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
