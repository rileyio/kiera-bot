import * as Utils from '@/utils'
import { User, Message } from 'discord.js'
import { Bot } from '@/index'
import { TrackedMessage } from '@/objects/message'
import { TrackedUser } from '@/objects/user'
import { MessageRoute, ProcessedPermissions, RouterStats, ValidationType } from '@/router'

const DEFAULT_LOCALE = process.env.BOT_LOCALE

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
  public prefix: string
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
    this.prefix = init.prefix
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

  public $sb(baseString: string, data?: any) {
    return Utils.sb(baseString, Object.assign({}, data, { prefix: this.prefix }))
  }
}
