import * as deepExtend from 'deep-extend';
import * as XRegex from 'xregexp';
import { Validate, ValidationType } from "./validate";
import { Message } from 'discord.js';
import { Bot } from '..';
import { getArgs } from '../utils';

const prefix = process.env.BOT_MESSAGE_PREFIX

export interface RouteConfiguration {
  command?: string
  controller: Function | void
  example: string
  help?: string
  middleware?: Array<(routed: RouterRouted) => Promise<RouterRouted | void>>
  name: string
  validate: string
}

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
  public controller: Function
  public example: string
  public help: string
  public middleware: Array<(routed: RouterRouted) => Promise<RouterRouted | void>> = []
  public name: string
  public validate: string
  public validation: Validate

  constructor(route: RouteConfiguration) {
    // Merge props from RouteConfiguration passed
    deepExtend(this, route)
    // Set command branch for sorting
    this.command = this.getCommand(route.validate)
    // Process validation
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
    this.bot.DEBUG(`routes configured = ${this.routes.length}`)
  }

  public async route(message: Message) {
    // // Block my own messages
    // if (msg.author.id === '526039977247899649') return; // Hard block

    const containsPrefix = message.content.startsWith(prefix)

    if (containsPrefix) {
      this.bot.DEBUG_MSG_COMMAND(`Router -> ${message.content}`)

      const args = getArgs(message.content)
      // Find appropriate routes based on prefix command
      const routes = this.routes.filter(r => r.command === args[0])
      const route = routes.find(r => r.test(message.content.replace(/\s+/g, ' ')) === true)
      this.bot.DEBUG_MSG_COMMAND('Router -> Routes by command:', routes.length)

      // If no routes matched, stop here
      if (!route) return;
      this.bot.DEBUG_MSG_COMMAND('Router -> Route:', route.name)

      // Normal routed behaviour
      var routed = new RouterRouted({
        bot: this.bot,
        message: message,
        route: route,
        args: args,
      })

      var middlewareRemaining = Array.isArray(route.middleware) ? route.middleware.length : 0

      // Process middleware
      for (const middleware of route.middleware) {
        const fromMiddleware = await middleware(routed)
        // If the returned item is empty stop here
        if (!fromMiddleware) {
          break;
        }
        // When everything is ok, continue
        middlewareRemaining -= 1
      }

      // Stop execution of route if middleware is halted
      if (middlewareRemaining === 0) await route.controller(routed)
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