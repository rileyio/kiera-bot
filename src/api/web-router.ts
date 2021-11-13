import * as restify from 'restify'

import { Next, Request, Response } from 'restify'

import { Bot } from '@/index'
import { TrackedSession } from '@/objects/session'

export interface WebRoute {
  controller: Function | void
  method: 'get' | 'post' | 'delete' | 'put' | 'patch'
  middleware?: Array<(routed: WebRouted) => Promise<WebRouted | void>>
  name: string
  path: string
}

export class WebRouted {
  public Bot: Bot
  public route: WebRoute
  public controller: (routed: WebRouted) => Promise<boolean>
  // Restify args
  public req: Request
  public res: Response
  public next: Next
  public session: Partial<TrackedSession>

  constructor(init: Partial<WebRouted>) {
    Object.assign(this, init)
  }
}

export class WebRouter {
  public Bot: Bot
  public server: restify.Server
  public routes: Array<WebRoute> = []

  constructor(bot: Bot, server: restify.Server, routes: Array<WebRoute>) {
    this.Bot = bot
    this.server = server
    this.routes = routes

    for (let index = 0; index < this.routes.length; index++) {
      const route = this.routes[index]
      if (route.method === 'get') {
        this.server.get(route.path, async (req, res, next) =>
          middlewareHandler(
            new WebRouted({
              Bot: this.Bot,
              next: next,
              req: req,
              res: res,
              route: route
            })
          )
        )
      }
      if (route.method === 'post') {
        this.server.post(route.path, async (req, res, next) =>
          middlewareHandler(
            new WebRouted({
              Bot: this.Bot,
              next: next,
              req: req,
              res: res,
              route: route
            })
          )
        )
      }
      if (route.method === 'delete') {
        this.server.del(route.path, async (req, res, next) =>
          middlewareHandler(
            new WebRouted({
              Bot: this.Bot,
              next: next,
              req: req,
              res: res,
              route: route
            })
          )
        )
      }
      if (route.method === 'patch') {
        this.server.patch(route.path, async (req, res, next) =>
          middlewareHandler(
            new WebRouted({
              Bot: this.Bot,
              next: next,
              req: req,
              res: res,
              route: route
            })
          )
        )
      }
      if (route.method === 'put') {
        this.server.put(route.path, async (req, res, next) =>
          middlewareHandler(
            new WebRouted({
              Bot: this.Bot,
              next: next,
              req: req,
              res: res,
              route: route
            })
          )
        )
      }
    }
  }
}

export async function middlewareHandler(routed: WebRouted) {
  // Process middleware
  const mwareCount = Array.isArray(routed.route.middleware) ? routed.route.middleware.length : 0
  let mwareProcessed = 0

  for (const middleware of routed.route.middleware || []) {
    const fromMiddleware = await middleware(routed)
    // If the returned item is empty stop here
    if (!fromMiddleware) {
      break
    }
    // When everything is ok, continue
    mwareProcessed += 1
  }

  routed.Bot.Log.API.log(`Router -> [${routed.route.path}] WebRoute middleware processed: ${mwareProcessed}/${mwareCount}`)

  // Stop execution of route if middleware is halted
  if (mwareProcessed === mwareCount) {
    // Check status returns later for stats tracking
    await (<any>routed.route).controller(routed)
    return // End routing here
  }
}
