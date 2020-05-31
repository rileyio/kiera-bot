import { performance } from 'perf_hooks'
import { User, Message } from 'discord.js'
import { RouteConfigurationCategory, Validate, ProcessedPermissions, ValidationType } from '@/router'
import { Bot } from '@/index'
import { TrackedMessage } from './message'
import * as XRegExp from 'xregexp'
import { TrackedUser } from './user'

const DEFAULT_LOCALE = process.env.BOT_LOCALE

/**
 * Discord Command Route
 *
 * @export
 * @interface RouteConfiguration
 */
export interface RouteConfiguration {
  category: RouteConfigurationCategory
  command?: string
  controller: Function | void
  description?: string
  example?: string
  middleware?: Array<(routed: RouterRouted) => Promise<RouterRouted | void>>
  name: string
  permissions?: {
    defaultEnabled?: boolean
    restricted?: boolean
    serverAdminOnly?: boolean
    restrictedTo?: Array<string>
    serverOnly?: boolean
    manageChannelReq?: boolean
  }
  type: 'message' | 'reaction'
  validate?: string
}

export class RouterStats {
  private _performanceStart: number = performance.now()
  private _discordUser: User

  public get performance(): number {
    return Math.round(performance.now() - this._performanceStart)
  }

  /**
   * Example: Emma#1366
   * @readonly
   * @type {string}
   * @memberof RouterStats
   */
  public get user(): string {
    return `${this._discordUser.username}#${this._discordUser.discriminator}`
  }

  constructor(author: User) {
    this._discordUser = author
  }
}

/**
 * Message routing configured to Object for use by the router
 * @export
 * @class MessageRoute
 */
export class MessageRoute {
  public readonly _defaultPermissions = {
    defaultEnabled: true,
    restricted: false,
    serverAdminOnly: false,
    restrictedTo: [],
    serverOnly: true,
    manageChannelReq: false
  }

  public category: string
  public command: string
  public controller: (routed: RouterRouted) => Promise<Boolean>
  public description: string
  public example: string
  public help: string
  public middleware: Array<(routed: RouterRouted) => Promise<RouterRouted | void>> = []
  public name: string
  public permissions: {
    defaultEnabled: boolean
    restricted: boolean
    serverAdminOnly: boolean
    restrictedTo: Array<string>
    serverOnly: boolean
    manageChannelReq: boolean
  }
  public type: 'message' | 'reaction'
  public validate: string
  public validation: Validate

  constructor(route: RouteConfiguration) {
    // Merge props from RouteConfiguration passed
    Object.assign(this, route)
    // Set command branch for sorting - only set this if the type is a message
    this.command = this.type === 'message' ? this.getCommand(route.validate) : undefined
    // Setup validation for route
    this.validation = new Validate(route.validate)
    // Ensure permissions is setup properly
    this.permissions = this._defaultPermissions
    Object.assign(this.permissions, route.permissions)
    // Restricted should override defaultEnabled
    this.permissions.defaultEnabled = this.permissions.restricted === true ? false : this.permissions.defaultEnabled
  }

  public test(message: string) {
    return this.validation.test(message)
  }

  private getCommand(str: string) {
    const regex = XRegExp('^\\/(?<name>[a-z0-9]*)', 'i')
    const match = XRegExp.exec(str, regex)
    return match['name']
  }
}

/**
 * Payload sent to each Controller
 *
 * @export
 * @class RouterRouted
 */
export class RouterRouted {
  public args: Array<string>
  public author: User
  public bot: Bot
  public isDM: boolean
  public message: Message
  public permissions: ProcessedPermissions
  public reaction: {
    snowflake: string
    reaction: string
  }
  public route: MessageRoute
  public routerStats: RouterStats
  public state: 'added' | 'removed'
  public trackedMessage: TrackedMessage
  public type: 'message' | 'reaction'
  public user: TrackedUser
  public v: {
    valid: boolean
    validated: ValidationType[]
    o: { [key: string]: any }
  }

  constructor(init: Partial<RouterRouted>) {
    // Object.assign(this, init)
    this.args = init.args
    this.author = init.author
    this.bot = init.bot
    this.isDM = init.isDM
    this.message = init.message
    this.permissions = init.permissions
    this.reaction = init.reaction
      ? {
          snowflake: init.reaction.snowflake,
          reaction: init.reaction.reaction
        }
      : undefined
    this.route = init.route
    this.routerStats = init.routerStats
    this.state = init.state
    this.trackedMessage = init.trackedMessage
    this.type = init.type
    this.user = init.user
    // Generate v.*
    this.v = this.route.validation.validateArgs(this.args)
  }

  public $render<T>(key: string, data?: T): string
  public $render<T>(locale: string, key: string, data?: T): string
  public $render<T>(locale: string, key?: string | T, data?: T): string {
    // When a locale override is passed too
    if (typeof locale === 'string' && typeof key === 'string') {
      return this.bot.Localization.$render(locale, key as string, arguments[2])
    }

    // Use locale from this.user
    return this.bot.Localization.$render(this.user ? this.user.locale : DEFAULT_LOCALE, locale, key as T)
  }

  public $localeExists(key: string) {
    return this.bot.Localization.$localeExists(key)
  }

  public $localeContributors(locale: string) {
    return this.bot.Localization.$localeContributors(locale) || ''
  }

  public $locales() {
    return this.bot.Localization.$locales()
  }
}
