import { Bot } from '../..';

export class Controller {
  protected Bot: Bot
  protected DEBUG_WEBAPI: debug.IDebugger

  constructor(bot: Bot, debug: debug.IDebugger) {
    this.Bot = bot
    this.DEBUG_WEBAPI = debug
  }
}

export * from './sessions'