import * as Utils from '@/utils'
import { User, Message, MessagePayload, ReplyMessageOptions, BaseCommandInteraction, GuildMember, Guild, Channel, TextChannel } from 'discord.js'
import { Bot } from '@/index'
import { TrackedMessage } from '@/objects/message'
import { TrackedUser } from '@/objects/user/'
import { MessageRoute, ProcessedPermissions, RouterStats, Validate, ValidationType } from '@/router'

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
  public channel: Channel | TextChannel
  public guild: Guild
  public interaction: BaseCommandInteraction
  public isDM: boolean
  public member: GuildMember
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
  public type: 'message' | 'reaction' | 'interaction'
  public user: TrackedUser
  public v: {
    valid: boolean
    validated: ValidationType[]
    o: { [key: string]: any }
  }
  public validateMatch?: string

  constructor(init: Partial<RouterRouted>) {
    // Object.assign(this, init)
    this.args = init.args
    this.author = init.author
    this.bot = init.bot
    this.channel = init.channel
    this.guild = init.guild
    this.interaction = init.interaction
    this.isDM = init.isDM
    this.member = init.member
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
    this.validateMatch = init.validateMatch
    // Generate v.*
    if (this.type === 'message') {
      const validate = new Validate(this.validateMatch)
      this.v = validate.validateArgs(this.args)
    }
  }

  public $render<T>(key: string, data?: T): string
  public $render<T>(locale: string, key: string, data?: T): string
  public $render<T>(locale: string, key?: string | T, data?: T): string {
    // When a locale override is passed too
    if (typeof locale === 'string' && typeof key === 'string') {
      return this.bot.Localization.$render(locale, key as string, Object.assign({}, arguments[2], { prefix: this.prefix }))
    }

    // Use locale from this.user
    return this.bot.Localization.$render(this.user ? this.user.locale : DEFAULT_LOCALE, locale, Object.assign({}, key, { prefix: this.prefix }) as T)
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

  public async reply(response: string | MessagePayload | ReplyMessageOptions) {
    try {
      if (this.route.slash) await this.interaction.reply(response)
      else await this.message.reply(response)
      return true
    } catch (error) {
      this.bot.Log.Router.error('Unable to .reply =>', error)
      return false
    }
  }
}
