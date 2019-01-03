import * as deepExtend from 'deep-extend';
import * as XRegex from 'xregexp';
import { Validate, ValidationType } from './validate';
import { Message, MessageReaction, User } from 'discord.js';
import { Bot } from '..';
import * as Utils from '../utils';

const prefix = process.env.BOT_MESSAGE_PREFIX

export interface RouteConfiguration {
  command?: string
  controller: Function | void
  example: string
  help?: string
  middleware?: Array<(routed: RouterRouted) => Promise<RouterRouted | void>>
  name: string
  commandTarget: RouteActionUserTarget
  validate: string
}

export interface ReactionRouteConfiguration {
  command?: string
  controller: Function | void
  middleware?: Array<(routed: RouterRouted) => Promise<RouterRouted | void>>
  name: string
  commandTarget: RouteActionUserTarget
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

export class Route {
  public command: string
  public controller: (routed: RouterRouted) => Promise<Boolean>
  public example: string
  public help: string
  public middleware: Array<(routed: RouterRouted) => Promise<RouterRouted | void>> = []
  public name: string
  public commandTarget: RouteActionUserTarget = 'none' // Default to none
  public validate: string
  public validation: Validate

  constructor(route: RouteConfiguration) {
    // Merge props from RouteConfiguration passed
    deepExtend(this, route)
    // Set command branch for sorting
    this.command = this.getCommand(route.validate)
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
  public routes: Array<Route>

  constructor(routes: Array<RouteConfiguration>, bot?: Bot) {
    this.bot = bot
    this.routes = routes.map(r => new Route(r))
    this.bot.DEBUG.log(`routes configured = ${this.routes.length}`)
  }

  public async routeReaction(reaction: MessageReaction, user: User, direction: 'added' | 'removed') {
    this.bot.DEBUG_MSG_COMMAND.log(`Router -> incoming reaction <@${user.id}> ${direction} "${reaction.emoji.name}".`)
    var routed = new RouterReactionRouted({
      bot: this.bot,
      reaction: reaction,
      state: direction,
      user: user
    })
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
        bot: this.bot,
        message: message,
        route: route,
        args: args
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
  public route: Route
  public v: {
    valid: boolean;
    validated: ValidationType[];
    o: { [key: string]: any };
  }

  constructor(init: Partial<RouterRouted>) {
    this.bot = init.bot
    this.message = init.message
    this.route = init.route
    this.args = init.args
    // Generate v.*
    this.v = this.route.validation.validateArgs(this.args)
  }
}

export class RouterReactionRouted {
  public bot: Bot
  public reaction: MessageReaction
  public state: 'added' | 'removed'
  public user: User

  constructor(init: Partial<RouterReactionRouted>) {
    this.bot = init.bot
    this.reaction = init.reaction
    this.user = init.user
  }
}