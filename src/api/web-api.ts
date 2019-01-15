import * as restify from 'restify';
import * as Debug from 'debug';
import * as Controllers from './controllers/index';
import * as fs from 'fs';
import * as path from 'path';
import * as corsMiddleware from 'restify-cors-middleware';
import * as SocketIO from 'socket.io';
import { Bot } from '..';
import { SessionsAPI, StatsAPI } from './controllers/index';
import { AuthKey } from '../objects/authkey';

export class WebAPI {
  protected Bot: Bot
  protected https = {
    key: fs.readFileSync(path.join(process.env.API_HTTPS_KEY)),
    certificate: fs.readFileSync(path.join(process.env.API_HTTPS_CRT))
  }
  protected server: restify.Server
  protected socket: SocketIO.Server
  protected readonly port: number = Number(process.env.API_PORT || 8234)
  protected readonly prefix: string = '/api'
  protected DEBUG_WEBAPI = Debug('ldi:WebAPI');

  // Controllers
  protected Sessions: Controllers.SessionsAPI
  protected Stats: Controllers.StatsAPI

  constructor(bot: Bot) {
    this.Bot = bot

    // Setup controllers
    this.Sessions = new SessionsAPI(this.Bot, this.DEBUG_WEBAPI)
    this.Stats = new StatsAPI(this.Bot, this.DEBUG_WEBAPI)

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

    // Configured routes
    this.server.post(`${this.prefix}/sessions`, (req, res, next) => this.Sessions.getAll(req, res, next))
    this.server.post(`${this.prefix}/session`, (req, res, next) => this.Sessions.get(req, res, next))
    this.server.get(`${this.prefix}/stats`, (req, res, next) => this.Stats.getAll(req, res, next))

    // Setup SocketIO
    this.socket = SocketIO.listen(this.server.server)
    this.socket.sockets.on('connection', (socket) => {
      this.DEBUG_WEBAPI('socket connection')
      socket.emit('news', { hello: 'world' });
      socket.on('my other event', (data) => {
        this.DEBUG_WEBAPI(data);
      });
      socket.emit('heartbeat', { stats: this.Bot.Stats.Bot })
    });
  }

  public listen() {
    this.server.listen(this.port, () => {
      this.DEBUG_WEBAPI(`${this.server.name} listening at ${this.server.url}`)
    });
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
    const authKeyStored = await this.Bot.AuthKeys.get({ hash: newLookupRegex })
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