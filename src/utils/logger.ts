import * as Winston from 'winston'

import { Types } from '#utils'

export class Debug {
  public readonly name: string
  private winston: Winston.Logger
  private fileFormat = Winston.format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} ${level} ${message}`
  })
  private consoleFormat = Winston.format.printf(({ level, message, label, timestamp }) => {
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

    const fileLoggerProps = {
      format: Winston.format.combine(Winston.format.timestamp(), this.fileFormat),
      level: process.env.BOT_LOGGING || 'debug',
      transports: [
        new Winston.transports.File({
          filename: `./logs/${this.name}.log`
        }),
        new Winston.transports.Console({
          format: Winston.format.combine(this.consoleFormat, Winston.format.colorize({ all: true }))
        })
      ]
    }

    // If console.opts is set to false, overwrite transports to eliminate setup for console logging
    if (!this.options.console || !this._toConsole) fileLoggerProps.transports = [new Winston.transports.File({ filename: `./logs/${this.name}.log` })]
    this.winston = Winston.createLogger(fileLoggerProps)

    // Keep Winston from an exit if it fails
    this.winston.exitOnError = false

    // Bind _debug.log to console
    // this._debug.log = console.log.bind(console);
  }

  public debug(...args: Array<string | boolean | number | object>) {
    this.winston.debug(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '))
  }

  public error(...args: Array<string | boolean | number | object>) {
    this.winston.error(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '))
  }

  public log(...args: Array<string | boolean | number | object>) {
    this.winston.info(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '))
  }

  public verbose(...args: Array<string | boolean | number | object>) {
    this.winston.verbose(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '))
  }

  public warn(...args: Array<string | boolean | number | object>) {
    this.winston.warn(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' '))
  }
}
