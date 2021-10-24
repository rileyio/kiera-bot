import * as Utils from '../utils/'
import { Message, User, TextChannel, Interaction, GuildMember } from 'discord.js'
import { Bot } from '@/index'
import { TrackedMessage } from '../objects/message'
import { CommandPermission } from '../objects/permission'
import { fallbackHelp } from '@/embedded/fallback-help'
import { ProcessedPermissions } from './route-permissions'
import { ServerStatisticType } from '../objects/statistics'
import { MessageRoute, RouteConfiguration, RouterRouted, RouterStats } from '../objects/router/'
import { TrackedUser } from '@/objects/user/'
import { TrackedServer } from '@/objects/server'

const GLOBAL_PREFIX = process.env.BOT_MESSAGE_PREFIX

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
    var _dupRouteCheck = {}
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
      if (message.channel.type === 'DM') {
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
    const kieraUser = new TrackedUser(
      await this.bot.DB.get<TrackedUser>('users', { id: user.id })
    )

    // Check if not stored - will be no Discord ID
    if (!kieraUser.id) kieraUser.__notStored = true

    var routed = new RouterRouted({
      author: user,
      bot: this.bot,
      channel: message.channel as TextChannel,
      guild: message.guild,
      isDM: message.channel.type === 'DM',
      member: message.member,
      message: message,
      reaction: {
        snowflake: user.id,
        reaction: reaction
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

    this.bot.Log.Router.log(`Router -> Route middleware processed: ${mwareProcessed}/${mwareCount}`)

    // Stop execution of route if middleware is halted
    if (mwareProcessed === mwareCount) {
      // this.bot.BotMonitor.LiveStatistics.increment('commands-routed')
      // Check status returns later for stats tracking
      await route.controller(routed)
      // this.bot.BotMonitor.LiveStatistics.increment('commands-completed')
      return // End routing here
    }
  }

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
        name: 'command pre-routing',
        guild: { id: guildId, name: guild.name, channel: channel.id },
        error: 'Failed to process command',
        runtime: routerStats.performance,
        owner: user.id,
        successful: false,
        type: 'bot.command',
        where: 'Discord'
      })

      return // End here
    }

    // Lookup Kiera User in DB
    const kieraUser = new TrackedUser(
      await this.bot.DB.get<TrackedUser>('users', { id: user.id })
    )

    // Check if not stored - will be no Discord ID
    if (!kieraUser.id) kieraUser.__notStored = true

    // Normal routed behaviour
    var routed: RouterRouted = new RouterRouted({
      author: user,
      bot: this.bot,
      channel: channel as TextChannel,
      guild,
      interaction,
      isDM: channel.type === 'DM',
      isInteraction: true,
      member: member as GuildMember,
      route,
      type: route.type,
      user: kieraUser,
      routerStats: routerStats
    })

    // Process Permissions
    routed.permissions = await this.processPermissions(routed)
    this.bot.Log.Router.log('Router -> Permissions Check Results:', routed.permissions)

    if (!routed.permissions.pass) {
      this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')

      if (routed.permissions.outcome === 'FailedServerOnlyRestriction') {
        // Send message in response
        await routed.message.reply(routed.$render('Generic.Error.CommandDisabledInChannel', { command: commandName }))

        // Track in an audit event
        this.bot.Audit.NewEntry({
          name: routed.route.name,
          guild: { id: 'DM', name: 'DM', channel: 'DM' },
          error: 'Command disabled by permission in this channel',
          runtime: routerStats.performance,
          owner: routed.author.id,
          successful: false,
          type: 'bot.command',
          where: 'Discord'
        })
      } else {
        // Track in an audit event
        this.bot.Audit.NewEntry({
          name: routed.route.name,
          guild: { id: routed.message.guild.id, name: routed.message.guild.name, channel: channel.id },
          error: 'Command disabled by permissions',
          runtime: routerStats.performance,
          owner: routed.author.id,
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

    this.bot.Log.Router.log(`Router -> Route middleware processed: ${mwareProcessed} /${mwareCount}`)

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
          guild: routed.isDM ? { id: 'dm', name: 'dm', channel: 'dm' } : { id: routed.guild.id, name: routed.guild.name, channel: channel.id },
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
          name: routed.route.name,
          guild: { id: routed.guild.id, name: routed.guild.name, channel: channel.id },
          error: 'Command failed or returned false inside controller',
          runtime: routerStats.performance,
          owner: routed.author.id,
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
      if (message.channel.type === 'DM') {
        this.bot.BotMonitor.LiveStatistics.increment('dms-sent')
      }
      return // Hard block
    }

    // Messages incoming as DMs
    if (message.channel.type === 'DM') {
      this.bot.BotMonitor.LiveStatistics.increment('dms-received')
    } else {
      if (message.author.bot === false) {
        // Track stats
        this.bot.Statistics.trackServerStatistic(message.guild.id, message.channel.id, message.author.id, ServerStatisticType.Message)
      }
    }

    const server = message.channel.type === 'DM' ? { prefix: undefined } : await this.bot.DB.get<TrackedServer>('servers', { id: message.guild.id })
    // Halt here if the guild is unknown
    if (!server) return

    const prefix = server.prefix || GLOBAL_PREFIX
    const containsPrefix = message.content.startsWith(prefix)
    this.bot.BotMonitor.LiveStatistics.increment('messages-seen')

    // When the Bot Command Prefix is present
    if (containsPrefix) {
      // Remove prefix
      const messageContent = message.content.substr(prefix.length, message.content.length)

      // Split message by args (spaces/quoted values)
      const args = Utils.getArgs(messageContent)

      // Find appropriate routes based on prefix command
      const routes = this.routes.filter((r) => String(r.command).toLowerCase() === args[0].toLowerCase())
      this.bot.Log.Router.log(`Router -> Routes by '${args[0]}' command: ${routes.length}`)

      // If no routes matched, stop here
      if (routes.length === 0) return

      // Try to find a route
      var allCategoryRoutes = [] as Array<MessageRoute>
      var validateOutcome: { validateSignature: string; matched: boolean }

      const route = routes.find((r) => {
        // Add to examples
        if (r.permissions.restricted === false) allCategoryRoutes.push(r)
        else {
          this.bot.Log.Router.log(`Router -> Examples for command like '${args[0]}' Restricted!`)
        }

        // Set the validate outcome
        validateOutcome = r.test(messageContent)
        return validateOutcome.matched === true
      })

      // Lookup Kiera User in DB
      const kieraUser = new TrackedUser(
        await this.bot.DB.get<TrackedUser>('users', { id: message.author.id })
      )

      // Check if not stored - will be no Discord ID
      if (!kieraUser.id) kieraUser.__notStored = true

      // Stop if there's no specific route found
      if (route === undefined) {
        this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')

        // Provide some feedback about the failed command(s)
        var exampleUseOfCommand = this.bot.Localization.$render(kieraUser.locale, 'Generic.Error.CommandExactMatchFailedFallback', { command: args[0] })
        var examplesToAppend = ``
        for (let index = 0; index < allCategoryRoutes.length; index++) {
          const routeHint = allCategoryRoutes[index]
          var routeExample = `\`${Utils.sb(routeHint.example, { prefix })}\` `
          // Add description (if one is present to example)
          routeExample += routeHint.description && typeof routeHint.description === 'string' ? `\n└ ${this.bot.Localization.$render(kieraUser.locale, routeHint.description)}` : ''
          // Add newline if applicable
          routeExample += `${index < allCategoryRoutes.length - 1 ? '\n' : ''}`
          // Add to built examples string
          examplesToAppend += routeExample
        }

        // Send back in chat
        // If no commands are available, don't print the fallback (this typically means
        // the whole route has restrited coammnds)
        if (allCategoryRoutes.length === 0) return // stop here
        await message.channel.send({ embeds: [fallbackHelp(exampleUseOfCommand, examplesToAppend)] })

        // End routing
        // Track in an audit event
        this.bot.Audit.NewEntry({
          name: 'command pre-routing',
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
      // this.bot.Log.Router.log('Router -> Route:', route)

      // Normal routed behaviour
      var routed: RouterRouted = new RouterRouted({
        args: args,
        author: message.author,
        bot: this.bot,
        channel: message.channel as TextChannel,
        guild: message.guild,
        isDM: message.channel.type === 'DM',
        member: message.member,
        message: message,
        prefix,
        route: route,
        type: 'message',
        user: kieraUser,
        routerStats: routerStats,
        validateMatch: validateOutcome.validateSignature
      })

      // Process Permissions
      routed.permissions = await this.processPermissions(routed)
      this.bot.Log.Router.log('Router -> Permissions Check Results:', routed.permissions)

      if (!routed.permissions.pass) {
        this.bot.BotMonitor.LiveStatistics.increment('commands-invalid')

        if (routed.permissions.outcome === 'FailedServerOnlyRestriction') {
          // Send message in response
          await routed.message.reply(routed.$render('Generic.Error.CommandDisabledInChannel', { command: routed.message.content }))

          // Track in an audit event
          this.bot.Audit.NewEntry({
            name: routed.route.name,
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

      this.bot.Log.Router.log(`Router -> Route middleware processed: ${mwareProcessed} /${mwareCount}`)

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
            guild: routed.isDM
              ? { id: 'dm', name: 'dm', channel: 'dm' }
              : { id: routed.message.guild.id, name: routed.message.guild.name, channel: (<TextChannel>message.channel).name },
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
      hasAdministrator: !routed.isDM ? routed.member.permissions.has('ADMINISTRATOR') : false,
      hasManageChannel: !routed.isDM ? routed.member.permissionsIn(routed.channel.id).has('MANAGE_CHANNELS') : false,
      hasManageGuild: !routed.isDM ? routed.member.permissions.has('MANAGE_GUILD') : false
    }

    // [IF: serverOnly is set] Command is clearly meant for only servers
    if (routed.route.permissions.serverOnly === true && routed.isDM) {
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
    var commandPermission = new CommandPermission(
      (await routed.bot.DB.get<CommandPermission>('command-permissions', {
        serverID: !routed.isDM ? routed.guild.id : 'DM',
        channelID: !routed.isDM ? routed.channel.id : 'DM',
        command: routed.route.name
      })) || {
        // Defaults to True
        serverID: !routed.isDM ? routed.guild.id : 'DM',
        channelID: routed.channel.id,
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
