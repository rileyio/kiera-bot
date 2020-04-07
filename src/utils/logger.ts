import * as _Debug from 'debug'
import * as _Winston from 'winston'
import { Types } from '@/utils'

export namespace Logging {
  export class Debug {
    public readonly name: string
    private _debug: _Debug.IDebugger
    private _winston: _Winston.Logger
    private consoleFormat = _Winston.format.printf(({ level, message, label, timestamp }) => {
      return `${message}`
    })

    /**
     * Override set at startup
     * @private
     * @type {boolean}
     * @memberof Debug
     */
    private _toConsole: boolean = Types.toBoolean(process.env.BOT_LOGGING_CONSOLE)
    private options = {
      console: true
    }

    constructor(name: string, opts?: { console?: boolean }) {
      this.name = name
      Object.assign(this.options, opts || {})

      var loggerProps = {
        level: process.env.BOT_LOGGING || 'debug',
        transports: [
          new _Winston.transports.File({ filename: `./logs/${this.name}.log` }),
          new _Winston.transports.Console({ format: _Winston.format.combine(this.consoleFormat) })
        ],
        format: _Winston.format.combine(_Winston.format.timestamp(), _Winston.format.json())
      }

      // If console.opts is set to false, don't add it
      if (!this.options.console || !this._toConsole) loggerProps.transports = [new _Winston.transports.File({ filename: `./logs/${this.name}.log` })]

      // this._debug = _Debug(name)
      this._winston = _Winston.createLogger(loggerProps)

      // Keep Winston from an exit if it fails
      this._winston.exitOnError = false

      // Bind _debug.log to console
      // this._debug.log = console.log.bind(console);
    }

    public log(...args: Array<any>) {
      // switch (args.length) {
      //   case 1:
      //     this._debug(Utils.sb(args[0]))
      //     break;
      //   case 2:
      //     this._debug(Utils.sb(args[0]), Utils.sb(args[1]))
      //     break;
      //   case 3:
      //     this._debug(Utils.sb(args[0]), Utils.sb(args[1]), Utils.sb(args[2]))
      //     break;
      //   default:
      //     this._debug(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '))
      //     break;
      // }

      this._winston.info(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '))
    }
  }
}
