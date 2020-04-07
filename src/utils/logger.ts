import * as _Debug from 'debug'
import * as _Winston from 'winston'
import { Types } from '@/utils'

export namespace Logging {
  export class Debug {
    public readonly name: string
    private _debug: _Debug.IDebugger
    private _winston: _Winston.Logger
    private fileFormat = _Winston.format.printf(({ level, message, label, timestamp }) => {
      return `${timestamp} ${level} ${message}`
    })
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
        format: _Winston.format.combine(_Winston.format.timestamp(), this.fileFormat)
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
      this._winston.info(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '))
    }

    public warn(...args: Array<any>) {
      this._winston.warn(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '))
    }

    public error(...args: Array<any>) {
      this._winston.error(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '))
    }

    public debug(...args: Array<any>) {
      this._winston.debug(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '))
    }
  }
}
