import * as Utils from '../utils/'
import { Message, User, TextChannel } from 'discord.js'
import { Bot } from '@/index'
import { TrackedMessage } from '../objects/message'
import { CommandPermission } from '../objects/permission'
import { fallbackHelp } from '@/embedded/fallback-help'
import { ProcessedPermissions } from './route-permissions'
import { ServerStatisticType } from '../objects/statistics'
import { MessageRoute, RouteConfiguration, RouterRouted, RouterStats } from '../objects/router'

const prefix = process.env.BOT_MESSAGE_PREFIX

/**
 * The almighty incoming commands router!
 * @export
 * @class Router
 */
export class Router {
  public bot: Bot
  public routes: Array<MessageRoute>

  constructor(routes: Array<RouteConfiguration>, bot?: Bot) {
    this.bot = bot
    // Alert if duplicate route name is detected
    var _dupRouteCheck = {}
    routes.forEach(r => {
      if (_dupRouteCheck[r.name] !== undefined) this.bot.DEBUG.log(`!! Duplicate route name detected ${r.name}`)
      else _dupRouteCheck[r.name] = 1
    })

    this.routes = routes.map(r => new MessageRoute(r))
    this.bot.DEBUG.log(`routes configured = ${this.routes.filter(r => r.type === 'message').length}`)
    this.bot.DEBUG.log(`reacts configured = ${this.routes.filter(r => r.type === 'reaction').length}`)
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
    // Debug value set in .env
    if (process.env.BOT_BLOCK_REACTS === 'true') return // Should be set if 2 instances of bot are running
    // console.log('user', user)
    this.bot.DEBUG_MSG_COMMAND.log(`Router -> incoming reaction <@${user.id}> reaction:${reaction} ${direction}`)
    // console.log('reaction', reaction)
    // Block my own messages
    if (user.id === this.bot.client.user.id) {
      // Track my own messages when they are seen
      // this.bot.BotMonitor.LiveStatistics.increment('messages-sent')
      // Track if its a dm as well
      if (message.channel.type === 'dm') {
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
    var storedMessage = await this.bot.DB.get<TrackedMessage>('messages', { id: message.id })

    // Stop routing if no message is tracked
    if (!storedMessage) return

    // Init stored message
    storedMessage = new TrackedMessage(storedMessage)

    // Update stored record if it gets this far with any react changes
    // console.log('router sees:', message.reactions.array())
    storedMessage.update('reactions', message.reactions.array())
    await this.bot.DB.update('messages', { _id: storedMessage._id }, storedMessage)

    // Ensure stored message has a route name to properly route it
    if (!storedMessage.reactionRoute) return

    // Find route to send this message reaction upon
    const route = this.routes.find(r => {
      return r.name === storedMessage.reactionRoute && r.type === 'reaction'
    })
    this.bot.DEBUG_MSG_COMMAND.log('Router -> Route:', route)

    // Stop routing if no route match
    if (!route) return

    var routed = new RouterRouted({
      bot: this.bot,
      reaction: {
        snowflake: user.id,
        reaction: reaction
      },
      message: message,
      route: route,
      state: direction,
      trackedMessage: storedMessage,
      type: 'reaction',
      user: user
    })

    // Process middleware
    const mwareCount = Array.isArray(route.middleware) ? route.middleware.length : 0
    var mwareProcessed = 0

    for (const middleware of route.middleware) {
      const fromMiddleware = await middleware(routed)
      // If the returned item is empty stop here
      if (!fromMiddleware) {
        break
      }
      // When everything is ok, continue
      mwareProcessed += 1
    }

    this.bot.DEBUG_MSG_COMMAND.log(`Router -> Route middleware processed: ${mwareProcessed}/${mwareCount}`)

    // Stop execution of route if middleware is halted
    if (mwareProcessed === mwareCount) {
      // this.bot.BotMonitor.LiveStatistics.increment('commands-routed')
      // Check status returns later for stats tracking
      await route.controller(routed)
      // this.bot.BotMonitor.LiveStatistics.increment('commands-completed')
      return // End routing here
    }
  }

  /**
   * Route a Message to a Command Controller
   *
   * @param {Message} message
   * @returns
   * @memberof Router
   */
  public async routeMessage(message: Message) {
    const routerStats = new RouterStats(message.author)
    // Block my (Kiera's) own messages
    if (message.author.id === this.bot.client.user.id) {
      // Track my own messages when they are seen
      this.bot.BotMonitor.LiveStatistics.increment('messages-sent')
      // Track if its a dm as well
      if (message.channel.type === 'dm') {
        this.bot.BotMonitor.LiveStatistics.increment('dms-sent')
      }
      return // Hard block
    }

    // Messages incoming as DMs
    if (message.channel.type === 'dm') {
      this.bot.BotMonitor.LiveStatistics.increment('dms-received')
    } else {
      if (message.author.bot === false) {
        // Track stats
        this.bot.Statistics.trackServerStatistic(message.guild.id, message.channel.id, message.author.id, ServerStatisticType.Message)
      }
    }

    const containsPrefix = message.content.startsWith(prefix)
    this.bot.BotMonitor.LiveStatistics.increment('messages-seen')

    // When the Bot Command Prefix is present
    if (containsPrefix) {
      this.bot.DEBUG_MSG_COMMAND.log(`Router -> incoming message: '${message.content}'`)

      // Split message by args (spaces/quoted values)
      const args = Utils.getArgs(message.content)

      // Find appropriate routes based on prefix command
      const routes = this.routes.filter(r => r.command === args[0])
      this.bot.DEBUG_MSG_COMMAND.log(`Router -> Routes by '${args[0]}' command: ${routes.length}`)

      // If no routes matched, stop here
      if (routes.length === 0) return

      // Try to find a route
      var examples = []
      const route = routes.find(r => {
        // Add to examples
        if (r.permissions.restricted === false) examples.push(r.example)
        else {
          this.bot.DEBUG_MSG_COMMAND.log(`Router -> Examples for command like '${args[0]}' Restricted!`)
        }
        return r.test(message.content) === true
      })

      // Stop if there's no specific route found
      if (route === undefined) {
        this.bot.DEBUG_MSG_COMMAND.log(`Router -> Failed to match '${message.content}' to a route - ending routing`)
        this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')
        // Provide some feedback about the failed command(s)
        var exampleUseOfCommand = Utils.sb(Utils.en.error.commandExactMatchFailedOptions, { command: args[0] })
        var examplesToAppend = ``
        for (let index = 0; index < examples.length; index++) {
          const example = examples[index]
          examplesToAppend += `\`${Utils.sb(example)}\`${index < examples.length - 1 ? '\n' : ''}`
        }

        // Send back in chat
        // If no commands are available, don't print the fallback (this typically means
        // the whole route has restrited coammnds)
        if (examples.length === 0) return // stop here
        await message.channel.sendMessage(fallbackHelp(exampleUseOfCommand, examplesToAppend))

        // End routing
        // Track in an audit event
        this.bot.Audit.NewEntry({
          name: 'command pre-routing',
          details: message.content,
          guild: { id: message.guild.id, name: message.guild.name, channel: (<TextChannel>message.channel).name },
          error: 'Failed to process command',
          runtime: routerStats.performance,
          owner: message.author.id,
          successful: false,
          type: 'bot.command',
          where: 'Discord'
        })

        return // Hard Stop
      } // End of no routes

      // Process route
      this.bot.DEBUG_MSG_COMMAND.log('Router -> Route:', route)

      // Normal routed behaviour
      var routed: RouterRouted = new RouterRouted({
        args: args,
        bot: this.bot,
        isDM: message.channel.type === 'dm',
        message: message,
        route: route,
        type: 'message',
        user: message.author,
        routerStats: routerStats
      })

      // Process Permissions
      routed.permissions = await this.processPermissions(routed)
      this.bot.DEBUG_MSG_COMMAND.log('Router -> Permissions Check Results:', routed.permissions)

      if (!routed.permissions.pass) {
        this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')

        if (routed.permissions.outcome === 'FailedServerOnlyRestriction') {
          // Send message in response
          await routed.message.reply(Utils.sb(Utils.en.error.commandDisabledInChannel, { command: routed.message.content }))

          // Track in an audit event
          this.bot.Audit.NewEntry({
            name: routed.route.name,
            details: routed.message.content,
            guild: { id: 'DM', name: 'DM', channel: 'DM' },
            error: 'Command disabled by permission in this channel',
            runtime: routerStats.performance,
            owner: routed.message.author.id,
            successful: false,
            type: 'bot.command',
            where: 'Discord'
          })
        } else {
          // Track in an audit event
          this.bot.Audit.NewEntry({
            name: routed.route.name,
            details: routed.message.content,
            guild: { id: routed.message.guild.id, name: routed.message.guild.name, channel: (<TextChannel>message.channel).name },
            error: 'Command disabled by permissions',
            runtime: routerStats.performance,
            owner: routed.message.author.id,
            successful: false,
            type: 'bot.command',
            where: 'Discord'
          })
        }

        return // Hard Stop
      }

      const mwareCount = Array.isArray(route.middleware) ? route.middleware.length : 0
      var mwareProcessed = 0

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

      this.bot.DEBUG_MSG_COMMAND.log(`Router -> Route middleware processed: ${mwareProcessed} /${mwareCount}`)

      // Stop execution of route if middleware is completed
      if (mwareProcessed === mwareCount) {
        this.bot.BotMonitor.LiveStatistics.increment('commands-routed')
        const status = await route.controller(routed)
        // Successful completion of command
        if (status) {
          this.bot.BotMonitor.LiveStatistics.increment('commands-completed')
          // Track in an audit event
          this.bot.Audit.NewEntry({
            name: routed.route.name,
            details: routed.message.content,
            guild: routed.isDM ? { id: 'dm', name: 'dm', channel: 'dm' } : { id: routed.message.guild.id, name: routed.message.guild.name, channel: (<TextChannel>message.channel).name },
            owner: routed.message.author.id,
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
            name: routed.route.name,
            details: routed.message.content,
            guild: { id: routed.message.guild.id, name: routed.message.guild.name, channel: (<TextChannel>message.channel).name },
            error: 'Command failed or returned false inside controller',
            runtime: routerStats.performance,
            owner: routed.message.author.id,
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
    var checks: ProcessedPermissions = {
      // Permissions of user
      hasAdministrator: !routed.isDM ? routed.message.member.hasPermission('ADMINISTRATOR') : false,
      hasManageChannel: !routed.isDM ? routed.message.member.permissionsIn(routed.message.channel).hasPermission('MANAGE_CHANNELS') : false,
      hasManageGuild: !routed.isDM ? routed.message.member.hasPermission('MANAGE_GUILD') : false
    }

    // [IF: serverOnly is set] Command is clearly meant for only servers
    if (routed.route.permissions.serverOnly === true && routed.isDM) {
      checks.outcome = 'FailedServerOnlyRestriction'
      checks.pass = false
      return checks // Hard stop here
    }

    // [IF: Required user ID] Verify that the user calling is allowd to access (mostly legacy commands)
    if (routed.route.permissions.restrictedTo.length > 0) {
      if (routed.route.permissions.restrictedTo.findIndex(snowflake => snowflake === routed.message.author.id) > -1) {
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
    var commandPermission = new CommandPermission(
      (await routed.bot.DB.get<CommandPermission>('command-permissions', {
        serverID: !routed.isDM ? routed.message.guild.id : 'DM',
        channelID: !routed.isDM ? routed.message.channel.id : 'DM',
        command: routed.route.name
      })) || {
        // Defaults to True
        serverID: !routed.isDM ? routed.message.guild.id : 'DM',
        channelID: routed.message.channel.id,
        command: routed.route.name,
        enabled: true
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
