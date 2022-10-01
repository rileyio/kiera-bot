import * as Debug from 'debug'
import * as SocketIO from 'socket.io'
import * as SocketStats from '@/api/socket/stats'
import * as cors from 'restify-cors-middleware2'
import * as fs from 'fs'
import * as path from 'path'
import * as restify from 'restify'

import { WebRoute, WebRouter } from '@/api/web-router'

import { Bot } from '@/index'
import { webRouteLoader } from '@/api/router/route-loader'

export class WebAPI {
  // As of 6.0.0 as a reverse proxy is in use and HTTPS managed there in prod
  // HTTPS Certs are optional for the bot's API
  protected readonly isHTTPSSet =
    process.env.API_HTTPS_KEY && process.env.API_HTTPS_CRT && fs.existsSync(path.join(process.env.API_HTTPS_KEY)) && fs.readFileSync(path.join(process.env.API_HTTPS_CRT))
  protected readonly https = this.isHTTPSSet
    ? {
        certificate: fs.readFileSync(path.join(process.env.API_HTTPS_CRT)),
        key: fs.readFileSync(path.join(process.env.API_HTTPS_KEY))
      }
    : null
  protected readonly port: number = Number(process.env.API_PORT || 8234)
  protected readonly prefix: string = '/api'
  protected Bot: Bot
  protected server: restify.Server
  protected socket: SocketIO.Server
  protected router: WebRouter
  protected DEBUG_WEBAPI = Debug('WebAPI')
  public configuredRoutes: Array<WebRoute> = []

  constructor(bot: Bot) {
    this.Bot = bot

    const _cors = cors({
      allowHeaders: ['*'],
      exposeHeaders: ['API-Token-Expiry'],
      origins: ['*'],
      preflightMaxAge: 5
    })

    // Start Node Web server
    this.server = restify.createServer(this.isHTTPSSet ? this.https : {})

    // API config
    this.server.pre(_cors.preflight)
    this.server.use(_cors.actual)
    this.server.use(restify.plugins.queryParser())
    this.server.use(restify.plugins.bodyParser({ mapParams: true }))

    // Setup SocketIO
    this.socket = new SocketIO.Server(this.server.server, {
      cors: {
        origin: '*'
      }
    })
    this.socket.on('connection', () => {
      this.DEBUG_WEBAPI('socket connection')
      // socket.emit('news', { hello: 'world' });
      // socket.on('my other event', (data) => {
      //   this.DEBUG_WEBAPI(data);
      // });
      SocketStats.heartBeat(this.Bot, this.socket)
    })
    this.socket.on('disconnect', () => {
      this.DEBUG_WEBAPI('socket disconnect')
    })

    // Emit Stats (Loop)
    SocketStats.stats(this.Bot, this.socket)
  }

  public async start() {
    try {
      // Setup routes
      this.configuredRoutes = await webRouteLoader()
      // this.configuredRoutes.forEach(r => console.log(`api route:: [${r.method}] ${r.path}`))
      this.router = new WebRouter(this.Bot, this.server, this.configuredRoutes)

      return new Promise<boolean>((r) => {
        this.server.listen(this.port, () => {
          this.DEBUG_WEBAPI(`${this.server.name} listening at ${this.server.url}`)
          r(true)
        })
      })
    } catch (error) {
      this.DEBUG_WEBAPI(`listening error.. unable to complete startup`)
      return false
    }
  }

  public async close() {
    try {
      return new Promise<boolean>((r) => {
        this.server.close(() => {
          this.DEBUG_WEBAPI(`stopping WebAPI...`)
          r(true)
        })
      })
    } catch (error) {
      this.DEBUG_WEBAPI(`error stopping the WebAPI`)
      return false
    }
  }
}
