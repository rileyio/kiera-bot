import * as _Debug from 'debug';
import * as _Winston from 'winston';

export class Debug {
  public readonly name: string
  private _debug: _Debug.IDebugger
  private _winston: _Winston.Logger

  constructor(name: string) {
    this.name = name
    this._debug = _Debug(name)
    this._winston = _Winston.createLogger({
      level: process.env.BOT_LOGGING || 'debug',
      transports: [
        new _Winston.transports.File({ filename: `./logs/${this.name}.log` })
      ],
      format: _Winston.format.combine(
        _Winston.format.timestamp(),
        _Winston.format.json())
    })

    // Keep Winston from an exit if it fails
    this._winston.exitOnError = false;

    // Change to output path for Debug so that it can be picked up by rTail
    this._debug.log = console.info.bind(console);
  }

  public log(...args: Array<any>) {
    switch (args.length) {
      case 1:
        this._debug(args[0])
        break;
      case 2:
        this._debug(args[0], args[1])
        break;
      case 3:
        this._debug(args[0], args[1], args[2])
        break;
      default:
        this._debug(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '))
        break;
    }

    this._winston.info(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '))
  }
}