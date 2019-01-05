import * as deepExtend from 'deep-extend';
import * as XRegex from 'xregexp';
import { Validate, ValidationType } from './validate';
import { Message, MessageReaction, User } from 'discord.js';
import { Bot } from '..';
import * as Utils from '../utils';
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
//   example: '!ck ticker set type 2',
//   help: 'ck',
//   name: 'ticker-set-type',
//   validate: '/command:string/subroute:string/action:string/action2:string/type:number'
// }

export class MessageRoute {
  public command: string
  public controller: (routed: RouterRouted) => Promise<Boolean>
  public example: string
  public help: string
  public middleware: Array<(routed: RouterRouted) => Promise<RouterRouted | void>> = []
  public name: string
  public commandTarget: RouteActionUserTarget = 'none' // Default to none
  public type: 'message' | 'reaction'
  public validate: string
  public validation: Validate

  constructor(route: RouteConfiguration) {
    // Merge props from RouteConfiguration passed
    deepExtend(this, route)
    // Set command branch for sorting - only set this if the type is a message
    this.command = (this.type === 'message') ? this.getCommand(route.validate) : undefined
    // Setup validation for route
    this.validation = new Validate(route.validate)
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
    this.routes = routes.map(r => new MessageRoute(r))
    this.bot.DEBUG.log(`routes configured = ${this.routes.filter(r => r.type === 'message').length}`)
    this.bot.DEBUG.log(`reacts configured = ${this.routes.filter(r => r.type === 'reaction').length}`)
  }

  public async routeReaction(message: Message, reaction: string, user: User, direction: 'added' | 'removed') {
    // console.log('user', user)
    this.bot.DEBUG_MSG_COMMAND.log(`Router -> incoming reaction <@${user.id}> reaction:${reaction} ${direction}`)
    // console.log('reaction', reaction)
    // Block my own messages
    if (user.id === this.bot.client.user.id) {
      // Track my own messages when they are seen
      // this.bot.Stats.increment('messages-sent')
      // Track if its a dm as well
      if (message.channel.type === 'dm') {
        // this.bot.Stats.increment('dms-sent')
      }
      return; // Hard block
    }


    // Lookup tracked message in db
    var storedMessage = await this.bot.Messages.get<Partial<TrackedMessage>>({ id: message.id })

    // Stop routing if no message is tracked
    if (!storedMessage) return

    // Init stored message
    storedMessage = new TrackedMessage(storedMessage)

    // Update stored record if it gets this far with any react changes
    // console.log('router sees:', message.reactions.array())
    storedMessage.update('reactions', message.reactions.array())
    await this.bot.Messages.update({ _id: storedMessage._id }, storedMessage)

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
      // this.bot.Stats.increment('commands-routed')
      // Check status returns later for stats tracking
      const status = await route.controller(routed)
      // this.bot.Stats.increment('commands-completed')
      return // End routing here
    }
  }

  public async routeMessage(message: Message) {
    // Block my own messages
    if (message.author.id === this.bot.client.user.id) {
      // Track my own messages when they are seen
      this.bot.Stats.increment('messages-sent')
      // Track if its a dm as well
      if (message.channel.type === 'dm') {
        this.bot.Stats.increment('dms-sent')
      }
      return; // Hard block
    }

    // Messages incoming as DMs
    if (message.channel.type === 'dm') {
      this.bot.Stats.increment('dms-received')
    }

    const containsPrefix = message.content.startsWith(prefix)
    this.bot.Stats.increment('messages-seen')

    if (containsPrefix) {
      this.bot.DEBUG_MSG_COMMAND.log(`Router -> incoming message: '${message.content}'`)

      const args = Utils.getArgs(message.content)
      // Find appropriate routes based on prefix command
      const routes = this.routes.filter(r => r.command === args[0])
      this.bot.DEBUG_MSG_COMMAND.log(`Router -> Routes by '${args[0]}' command: ${routes.length}`)

      // If no routes matched, stop here
      if (routes.length === 0) return;

      // Try to find a route
      const route = await routes.find(r => { return r.test(message.content) === true })
      this.bot.DEBUG_MSG_COMMAND.log(route)

      // Stop if there's no specific route found
      if (route === undefined) {
        this.bot.DEBUG_MSG_COMMAND.log(`Router -> Failed to match '${message.content}' to a route - ending routing`)
        this.bot.Stats.increment('commands-invalid')
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

      this.bot.DEBUG_MSG_COMMAND.log(`Router -> Route middleware processed: ${mwareProcessed}/${mwareCount}`)

      // console.log(routed)

      // Stop execution of route if middleware is halted
      if (mwareProcessed === mwareCount) {
        this.bot.Stats.increment('commands-routed')
        const status = await route.controller(routed)
        this.bot.Stats.increment('commands-completed')
        return // End routing here
      }

      this.bot.Stats.increment('commands-invalid')
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
