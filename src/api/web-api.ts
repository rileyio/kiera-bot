import * as restify from 'restify'
import * as Debug from 'debug'
import * as fs from 'fs'
import * as path from 'path'
import * as corsMiddleware from 'restify-cors-middleware'
import * as SocketIO from 'socket.io'
import * as SocketStats from '@/api/socket/stats'
import { Bot } from '@/index'
import { routes } from '@/api/routes'
import { WebRouter } from '@/api/web-router'

export class WebAPI {
  protected Bot: Bot
  protected https = {
    key: fs.readFileSync(path.join(process.env.API_HTTPS_KEY)),
    certificate: fs.readFileSync(path.join(process.env.API_HTTPS_CRT))
  }
  protected server: restify.Server
  protected socket: SocketIO.Server
  protected router: WebRouter
  protected readonly port: number = Number(process.env.API_PORT || 8234)
  protected readonly prefix: string = '/api'
  protected DEBUG_WEBAPI = Debug('WebAPI')

  constructor(bot: Bot) {
    this.Bot = bot
    this.server = restify.createServer(this.https)
    // API config
    this.server.use(restify.plugins.bodyParser({ mapParams: true }))

    // Cors
    const cors = corsMiddleware({
      preflightMaxAge: 5, //Optional
      origins: ['*'],
      allowHeaders: ['*'],
      exposeHeaders: ['API-Token-Expiry']
    })

    this.server.pre(cors.preflight)
    this.server.use(cors.actual)

    // Setup routes
    // tslint:disable-next-line:no-console
    routes.forEach(r => console.log(`api route:: [${r.method}] ${r.path}`))
    this.router = new WebRouter(this.Bot, this.server, routes)

    // Setup SocketIO
    this.socket = SocketIO.listen(this.server.server)
    this.socket.sockets.on('connection', socket => {
      this.DEBUG_WEBAPI('socket connection')
      // socket.emit('news', { hello: 'world' });
      // socket.on('my other event', (data) => {
      //   this.DEBUG_WEBAPI(data);
      // });
      SocketStats.heartBeat(this.Bot, this.socket)
    })

    // Emit Stats (Loop)
    SocketStats.stats(this.Bot, this.socket)
  }

  public start() {
    return new Promise<boolean>(r => {
      this.server.listen(this.port, () => {
        this.DEBUG_WEBAPI(`${this.server.name} listening at ${this.server.url}`)
        r(true)
      })
    }).catch(error => {
      this.DEBUG_WEBAPI(`listening error.. unable to complete startup`)
      return false
    })
  }

  public close() {
    return new Promise<boolean>(r => {
      this.server.close(() => {
        this.DEBUG_WEBAPI(`stopping WebAPI...`)
        r(true)
      })
    }).catch(error => {
      this.DEBUG_WEBAPI(`error stopping the WebAPI`)
      return false
    })
  }
}
