import * as restify from 'restify';
import * as Debug from 'debug';
import * as Controllers from './controllers/index';
import { Bot } from '..';
import { SessionsAPI, StatsAPI } from './controllers/index';
import { AuthKey } from '../objects/authkey';

export class WebAPI {
  protected Bot: Bot
  protected server: restify.Server
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

    this.server = restify.createServer()

    // API config
    this.server.use(restify.plugins.bodyParser({ mapParams: true }))

    // Auth middleware
    this.server.use((rq, rs, n) => this.auth(rq, rs, n))

    // Configured routes
    this.server.get(`${this.prefix}/sessions`, (req, res, next) => this.Sessions.getAll(req, res, next))
    this.server.get(`${this.prefix}/session`, (req, res, next) => this.Sessions.get(req, res, next))
    this.server.get(`${this.prefix}/stats`, (req, res, next) => this.Stats.getAll(req, res, next))
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