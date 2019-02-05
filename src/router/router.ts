import * as XRegex from 'xregexp';
import { Validate, ValidationType } from './validate';
import { Message, User } from 'discord.js';
import { Bot } from '..';
import * as Utils from '../utils/';
import { TrackedMessage } from '../objects/message';

const prefix = process.env.BOT_MESSAGE_PREFIX

export interface RouteConfiguration {
  command?: string
  commandTarget: RouteActionUserTarget
  controller: Function | void
  example?: string
  help?: string
  middleware?: Array<(routed: RouterRouted) => Promise<RouterRouted | void>>
  name: string
  permissions?: {
    defaultEnabled?: boolean
    restricted?: boolean
    serverAdminOnly?: boolean
  }
  type: 'message' | 'reaction'
  validate?: string
}

export type RouteActionUserTarget = 'none'
  | 'author'
  | 'argument'
  | 'controller-decision'

///
// Route example
//
// {
//   controller: () => { /* do something here */ },
//   example: '{{prefix}}ck ticker set type 2',
//   help: 'ck',
//   name: 'ticker-set-type',
//   validate: '/command:string/subroute:string/action:string/action2:string/type:number'
// }

export class MessageRoute {
  public command: string
  public commandTarget: RouteActionUserTarget = 'none' // Default to none
  public controller: (routed: RouterRouted) => Promise<Boolean>
  public example: string
  public help: string
  public middleware: Array<(routed: RouterRouted) => Promise<RouterRouted | void>> = []
  public name: string
  public permissions = {
    defaultEnabled: true,
    restricted: false,
    serverAdminOnly: false
  }
  public type: 'message' | 'reaction'
  public validate: string
  public validation: Validate

  constructor(route: RouteConfiguration) {
    // Merge props from RouteConfiguration passed
    Object.assign(this, route)
    // Set command branch for sorting - only set this if the type is a message
    this.command = (this.type === 'message') ? this.getCommand(route.validate) : undefined
    // Setup validation for route
    this.validation = new Validate(route.validate)
    // Restricted should override defaultEnabled
    this.permissions.defaultEnabled = this.permissions.restricted === true
      ? false
      : this.permissions.defaultEnabled
  }

  public test(message: string) {
    return this.validation.test(message)
  }

  private getCommand(str: string) {
    const regex = XRegex('^\\/(?<name>[a-z0-9]*)', 'i')
    const match = XRegex.exec(str, regex)
    return match['name']
  }
}

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

  public async routeReaction(message: Message, reaction: string, user: User, direction: 'added' | 'removed') {
    // Debug value set in .env
    if (process.env.BOT_BLOCK_REACTS === 'true') return // Should be set if 2 instances of bot are running
    // console.log('user', user)
    this.bot.DEBUG_MSG_COMMAND.log(`Router -> incoming reaction <@${user.id}> reaction:${reaction} ${direction}`)
    // console.log('reaction', reaction)
    // Block my own messages
    if (user.id === this.bot.client.user.id) {
      // Track my own messages when they are seen
      // this.bot.BotMonitor.Stats.increment('messages-sent')
      // Track if its a dm as well
      if (message.channel.type === 'dm') {
        // this.bot.BotMonitor.Stats.increment('dms-sent')
      }
      return; // Hard block
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
    const route = this.routes.find(r => { return r.name === storedMessage.reactionRoute && r.type === 'reaction' })
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
      user: user,
    })

    // Process middleware
    const mwareCount = Array.isArray(route.middleware) ? route.middleware.length : 0
    var mwareProcessed = 0

    for (const middleware of route.middleware) {
      const fromMiddleware = await middleware(routed)
      // If the returned item is empty stop here
      if (!fromMiddleware) {
        break;
      }
      // When everything is ok, continue
      mwareProcessed += 1
    }

    this.bot.DEBUG_MSG_COMMAND.log(`Router -> Route middleware processed: ${mwareProcessed}/${mwareCount}`)

    // Stop execution of route if middleware is halted
    if (mwareProcessed === mwareCount) {
      // this.bot.BotMonitor.Stats.increment('commands-routed')
      // Check status returns later for stats tracking
      const status = await route.controller(routed)
      // this.bot.BotMonitor.Stats.increment('commands-completed')
      return // End routing here
    }
  }

  public async routeMessage(message: Message) {
    // Block my own messages
    if (message.author.id === this.bot.client.user.id) {
      // Track my own messages when they are seen
      this.bot.BotMonitor.Stats.increment('messages-sent')
      // Track if its a dm as well
      if (message.channel.type === 'dm') {
        this.bot.BotMonitor.Stats.increment('dms-sent')
      }
      return; // Hard block
    }

    // Messages incoming as DMs
    if (message.channel.type === 'dm') {
      this.bot.BotMonitor.Stats.increment('dms-received')
    }

    const containsPrefix = message.content.startsWith(prefix)
    this.bot.BotMonitor.Stats.increment('messages-seen')

    if (containsPrefix) {
      this.bot.DEBUG_MSG_COMMAND.log(`Router -> incoming message: '${message.content}'`)

      const args = Utils.getArgs(message.content)
      // Find appropriate routes based on prefix command
      const routes = this.routes.filter(r => r.command === args[0])
      this.bot.DEBUG_MSG_COMMAND.log(`Router -> Routes by '${args[0]}' command: ${routes.length}`)

      // If no routes matched, stop here
      if (routes.length === 0) return;

      // Try to find a route
      var examples = []
      const route = await routes.find(r => {
        // Add to examples
        if (r.permissions.restricted === false) examples.push(r.example)
        return r.test(message.content) === true
      })
      this.bot.DEBUG_MSG_COMMAND.log(route)

      // Stop if there's no specific route found
      if (route === undefined) {
        this.bot.DEBUG_MSG_COMMAND.log(`Router -> Failed to match '${message.content}' to a route - ending routing`)
        this.bot.BotMonitor.Stats.increment('commands-invalid')
        // Provide some feedback about the failed command(s)
        var exampleUseOfCommand = Utils.sb(Utils.en.error.commandExactMatchFailedOptions, { command: args[0] })
        var examplesToAppend = ``
        for (let index = 0; index < examples.length; index++) {
          const example = examples[index];
          examplesToAppend += `\`${Utils.sb(example)}\`${(index < examples.length - 1) ? '   ' : ''}`
        }
        // Send back in chat
        // If no commands are available, don't print the fallback (this typically means
        // the whole route has restrited coammnds)
        if (examples.length === 0) return // stop here
        await message.channel.send(`${exampleUseOfCommand}\n${examplesToAppend}`)
        // End routing
        return;
      }

      // Process route
      this.bot.DEBUG_MSG_COMMAND.log('Router -> Route:', route)

      // Normal routed behaviour
      var routed = new RouterRouted({
        args: args,
        bot: this.bot,
        message: message,
        route: route,
        type: 'message',
        user: message.author
      })

      const mwareCount = Array.isArray(route.middleware) ? route.middleware.length : 0
      var mwareProcessed = 0

      // Process middleware
      for (const middleware of route.middleware) {
        const fromMiddleware = await middleware(routed)
        // If the returned item is empty stop here
        if (!fromMiddleware) {
          break;
        }
        // When everything is ok, continue
        mwareProcessed += 1
      }

      this.bot.DEBUG_MSG_COMMAND.log(`Router -> Route middleware processed: ${mwareProcessed} /${mwareCount}`)

      // console.log(routed)

      // Stop execution of route if middleware is halted
      if (mwareProcessed === mwareCount) {
        this.bot.BotMonitor.Stats.increment('commands-routed')
        const status = await route.controller(routed)
        if (status) this.bot.BotMonitor.Stats.increment('commands-completed')
        else this.bot.BotMonitor.Stats.increment('commands-invalid')
        return // End routing here
      }

      this.bot.BotMonitor.Stats.increment('commands-invalid')
      return
    }
  }
}

export class RouterRouted {
  public args: Array<string>
  public bot: Bot
  public message: Message
  public reaction: {
    snowflake: string,
    reaction: string
  }
  public route: MessageRoute
  public state: 'added' | 'removed'
  public trackedMessage: TrackedMessage
  public type: 'message' | 'reaction'
  public user: User
  public v: {
    valid: boolean;
    validated: ValidationType[];
    o: { [key: string]: any };
  }

  constructor(init: Partial<RouterRouted>) {
    // Object.assign(this, init)
    this.args = init.args
    this.bot = init.bot
    this.message = init.message
    this.reaction = init.reaction
      ? {
        snowflake: init.reaction.snowflake,
        reaction: init.reaction.reaction
      }
      : undefined
    this.route = init.route
    this.state = init.state
    this.trackedMessage = init.trackedMessage
    this.type = init.type
    this.user = init.user
    // Generate v.*
    this.v = this.route.validation.validateArgs(this.args)
  }
}
