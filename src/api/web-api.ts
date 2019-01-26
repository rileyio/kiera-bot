import * as restify from 'restify';
import * as Debug from 'debug';
import * as Controllers from './controllers/index';
import * as fs from 'fs';
import * as path from 'path';
import * as corsMiddleware from 'restify-cors-middleware';
import * as SocketIO from 'socket.io';
import { Bot } from '..';
import { AuthKey } from '../objects/authkey';
import { routes } from './routes';
import { WebRouter } from './web-router';

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
  protected DEBUG_WEBAPI = Debug('ldi:WebAPI');

  // Controllers
  // protected Lists: Controllers.ListsAPI
  // protected Permissions: Controllers.PermissionsAPI
  // protected Sessions: Controllers.SessionsAPI
  // protected Stats: Controllers.StatsAPI
  // protected User: Controllers.UserAPI

  constructor(bot: Bot) {
    this.Bot = bot

    // Setup controllers //
    // this.Lists = new Controllers.ListsAPI(this.Bot, this.DEBUG_WEBAPI)
    // this.Permissions = new Controllers.PermissionsAPI(this.Bot, this.DEBUG_WEBAPI)
    // this.Sessions = new Controllers.SessionsAPI(this.Bot, this.DEBUG_WEBAPI)
    // this.Stats = new Controllers.StatsAPI(this.Bot, this.DEBUG_WEBAPI)
    // this.User = new Controllers.UserAPI(this.Bot, this.DEBUG_WEBAPI)

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

    // Auth middleware
    this.server.use((rq, rs, n) => this.auth(rq, rs, n))

    // Setup routes
    this.router = new WebRouter(this.Bot, this.server, routes)

    // // Configured routes [ Session ]
    // this.server.post(`${this.prefix}/sessions`, (req, res, next) => this.Sessions.getAll(req, res, next))
    // this.server.post(`${this.prefix}/session`, (req, res, next) => this.Sessions.get(req, res, next))

    // // Configured routes [ kiera-web ]
    // this.server.post(`${this.prefix}/lists`, (req, res, next) => this.Lists.get(req, res, next))
    // this.server.post(`${this.prefix}/permissions`, (req, res, next) => this.Permissions.getAll(req, res, next))
    // this.server.post(`${this.prefix}/permission`, (req, res, next) => this.Permissions.get(req, res, next))
    // this.server.post(`${this.prefix}/user`, (req, res, next) => this.User.get(req, res, next))
    // this.server.post(`${this.prefix}/oauth`, (req, res, next) => this.User.oauth(req, res, next))

    // // Configured routes [ any ]
    // this.server.get(`${this.prefix}/stats`, (req, res, next) => this.Stats.getAll(req, res, next))

    // Setup SocketIO
    this.socket = SocketIO.listen(this.server.server)
    this.socket.sockets.on('connection', (socket) => {
      this.DEBUG_WEBAPI('socket connection')
      socket.emit('news', { hello: 'world' });
      socket.on('my other event', (data) => {
        this.DEBUG_WEBAPI(data);
      });
      socket.emit('heartbeat', { stats: this.Bot.BotMonitor.Stats.Bot })
    });
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

  public async auth(req: restify.Request, res: restify.Response, next: restify.Next) {
    const authKey = req.header('AuthKey');
    // Make sure the AuthKey header is present
    if (!authKey || authKey.replace(' ', '') === '') {
      // console.log('AuthKey missing')
      res.send(401, 'Unauthorized');
      return next(false);
    }

    const keysplit = authKey.split(':')
    const newLookupRegex = RegExp(`^${keysplit[0]}\\:${keysplit[1]}`)
    const authKeyStored = await this.Bot.DB.get<AuthKey>('authkeys', { hash: newLookupRegex })
    // console.log('newLookupRegex', newLookupRegex)
    // console.log('authKeyStored', authKeyStored)

    // AuthKey is not in db
    if (!authKeyStored) {
      // console.log('AuthKey not in db')
      res.send(401, 'Unauthorized');
      return next(false);
    }

    // Does match the user & id - now test if it's valild
    const nauthKeyStored = new AuthKey(authKeyStored)
    // console.log('nauthKeyStored', nauthKeyStored.hash, nauthKeyStored.test(authKey))
    if (nauthKeyStored.test(authKey)) return next()

    // Fallback - fail auth
    // console.log('fallback - auth fail')
    res.send(401, 'Unauthorized');
    return next(false);
  }
}