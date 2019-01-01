import * as restify from 'restify';
import * as Debug from 'debug';
import * as Controllers from './controllers/index';
import { Bot } from '..';
import { SessionsAPI, StatsAPI } from './controllers/index';

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
}