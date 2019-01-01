import * as Validation from '../validations/index';
import { Request, Response, Next } from 'restify';
import { Controller } from '.';

export class StatsAPI extends Controller {
  public async getAll(req: Request, res: Response, next: Next) {
    return res.send(this.Bot.Stats.Bot);
  }
}