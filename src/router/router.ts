/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheType, ChatInputCommandInteraction, GuildMember, Interaction, TextChannel } from 'discord.js'
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

  public addRoute(route: RouteConfiguration) {
    if (this.routes.findIndex((r) => r.name === route.name) > -1) return this.bot.Log.Router.log(`!! Duplicate route name detected '${route.name}'`)
    this.routes.push(new MessageRoute(route))
    this.log.verbose(`🚏✔️ Route Added '${route.name}'`)
  }

  public removeRoute(route: string | MessageRoute) {
    const routeIndex = this.routes.findIndex((r) => r.name === (typeof route === 'string' ? (route as string) : (route as MessageRoute).name))
    const routeFound = routeIndex > -1 ? this.routes[routeIndex] : undefined
    if (routeFound) this.routes.splice(routeIndex, 1)
    this.log.log(`🚏❌ Unloaded Route '${routeFound.name}'`)
  }

  // /**
  //  * Route incoming Reaction Event
  //  *
  //  * @param {Message} message
  //  * @param {string} reaction
  //  * @param {User} user
  //  * @param {('added' | 'removed')} direction
  //  * @returns
  //  * @memberof Router
  //  */
  // public async routeReaction(message: Message, reaction: string, user: User, direction: 'added' | 'removed') {
  //   const routerStats = new RouterStats(message.author)
  //   // Debug value set in .env
  //   if (process.env.BOT_BLOCK_REACTS === 'true') return // Should be set if 2 instances of bot are running
  //   // console.log('user', user)
  //   this.bot.Log.Router.log(`Router -> incoming reaction <@${user.id}> reaction:${reaction} ${direction}`)
  //   // console.log('reaction', reaction)
  //   // Block my own messages
  //   if (user.id === this.bot.client.user.id) {
  //     // Track my own messages when they are seen
  //     // this.bot.BotMonitor.LiveStatistics.increment('messages-sent')
  //     // Track if its a dm as well
  //     if (message.channel.type === ChannelType.DM) {
  //       // this.bot.BotMonitor.LiveStatistics.increment('dms-sent')
  //     }
  //     return // Hard block
  //   } else {
  //     if (direction === 'added' && user.bot === false) {
  //       // Track stats
  //       this.bot.Statistics.trackServerStatistic(message.guild.id, message.channel.id, user.id, .Reaction)
  //     }
  //   }

  //   // Lookup tracked message in db
  //   let storedMessage = await this.bot.DB.get('messages', { id: message.id })

  //   // Stop routing if no message is tracked
  //   if (!storedMessage) return

  //   // Init stored message
  //   storedMessage = new (storedMessage)

  //   // Update stored record if it gets this far with any react changes
  //   // console.log('router sees:', message.reactions.cache.array())
  //   storedMessage.update('reactions', [...message.reactions.cache.values()])
  //   await this.bot.DB.update('messages', { _id: storedMessage._id }, storedMessage)

  //   // Ensure stored message has a route name to properly route it
  //   if (!storedMessage.reactionRoute) return

  //   // Find route to send this message reaction upon
  //   const route = this.routes.find((r) => {
  //     return r.name === storedMessage.reactionRoute && r.type === 'reaction'
  //   })
  //   this.bot.Log.Router.log('Router -> Route:', route)

  //   // Stop routing if no route match
  //   if (!route) return

  //   // Lookup Kiera User in DB
  //   const kieraUser = new TrackedUser(await this.bot.DB.get('users', { id: user.id }))

  //   // Check if not stored - will be no Discord ID
  //   if (!kieraUser.id) kieraUser.__notStored = true

  //   const routed = new RouterRouted({
  //     author: user,
  //     bot: this.bot,
  //     channel: message.channel as TextChannel,
  //     guild: message.guild,
  //     member: message.member,
  //     message: message,
  //     reaction: {
  //       reaction: reaction,
  //       snowflake: user.id
  //     },
  //     route: route,
  //     routerStats: routerStats,
  //     state: direction,
  //     : storedMessage,
  //     type: 'reaction',
  //     user: kieraUser
  //   })

  //   // Process middleware
  //   const mwareCount = Array.isArray(route.middleware) ? route.middleware.length : 0
  //   let mwareProcessed = 0

  //   for (const middleware of route.middleware) {
  //     const fromMiddleware = await middleware(routed)
  //     // If the returned item is empty stop here
  //     if (!fromMiddleware) {
  //       break
  //     }
  //     // When everything is ok, continue
  //     mwareProcessed += 1
  //   }

  //   this.bot.Log.Router.log(`Router -> Route middleware processed: ${mwareProcessed}/${mwareCount}`)

  //   // Stop execution of route if middleware is halted
  //   if (mwareProcessed === mwareCount) {
  //     // this.bot.BotMonitor.LiveStatistics.increment('commands-routed')
  //     // Check status returns later for stats tracking
  //     try {
  //       if (route.plugin) await route.controller(route.plugin, routed)
  //       else await route.controller(routed)
  //     } catch (error) {
  //       this.bot.Log.Router.error('Router -> Failed to fully execute controller, error:', error)
  //     }
  //     // this.bot.BotMonitor.LiveStatistics.increment('commands-completed')
  //     return // End routing here
  //   }
  // }

  /**
   * Process Routed Slash Command
   * @param interaction
   * @returns
   */
  public async routeInteraction(_interaction: Interaction) {
    if (!_interaction.isCommand()) return // Hard block
    if (!_interaction.isChatInputCommand()) return

    // if (!interaction.guild) {
    //   return interaction.reply('Kiera is only currently enabled inside of a Discord Server due to certain command limitations') // Hard block
    // }

    const { channel, commandName, guild, guildId, member, options, user } = _interaction
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
      this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')

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
