import * as Utils from '@/utils'

import { Channel, CommandInteraction, Guild, GuildMember, InteractionReplyOptions, Message, MessagePayload, ReplyMessageOptions, TextChannel, User } from 'discord.js'
import { MessageRoute, ProcessedPermissions, RouterStats, Validate, ValidationType } from '@/router'

import { Bot } from '@/index'
import { TrackedMessage } from '@/objects/message'
import { TrackedUser } from '@/objects/user/'

const DEFAULT_LOCALE = process.env.BOT_LOCALE

/**
 * Payload sent to each Controller
 *
 * @export
 * @class RouterRouted
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export class RouterRouted<T extends { [key: string]: any } = undefined> {
export class RouterRouted<T = undefined> {
  public args: Array<string>
  public author: User
  public bot: Bot
  public channel: Channel | TextChannel
  public guild: Guild
  public interaction: CommandInteraction
  public isInteraction: boolean
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
    // o: T
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    o: T | { [key: string]: any }
  }
  public validateMatch?: string

  constructor(init: Partial<RouterRouted<T>>) {
    // Object.assign(this, init)
    this.args = init.args
    this.author = init.author
    this.bot = init.bot
    this.channel = init.channel
    this.guild = init.guild
    this.interaction = init.interaction
    this.isInteraction = init.isInteraction
    this.member = init.member
    this.message = init.message
    this.permissions = init.permissions
    this.prefix = init.prefix
    this.reaction = init.reaction
      ? {
          reaction: init.reaction.reaction,
          snowflake: init.reaction.snowflake
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
      return this.bot.Localization.$render(locale, key as string, Object.assign({}, data, { prefix: this.prefix }))
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

  public $sb<T>(baseString: string, data?: T) {
    return Utils.sb(baseString, Object.assign({}, data, { prefix: this.prefix }))
  }

  public async reply(response: string | MessagePayload | ReplyMessageOptions, ephemeral?: boolean) {
    try {
      if (this.route.slash && this.interaction) {
        if (typeof response === 'object') await (this.interaction as CommandInteraction).reply(Object.assign(response, { ephemeral }) as InteractionReplyOptions)
        else await (this.interaction as CommandInteraction).reply({ content: response, ephemeral })
      } else await this.reply(response)
      return true
    } catch (error) {
      this.bot.Log.Router.error('Unable to .reply =>', error)
      return false
    }
  }
}

export class RoutedInteraction {
  public args: Array<string>
  public author: User
  public bot: Bot
  public channel: Channel | TextChannel
  public guild: Guild
  public interaction: CommandInteraction
  public isInteraction: boolean
  public member: GuildMember
  public permissions: ProcessedPermissions
  public prefix: string
  public route: MessageRoute
  public routerStats: RouterStats
  public trackedMessage: TrackedMessage
  public type: 'interaction'
  public user: TrackedUser

  constructor(init: Partial<RoutedInteraction>) {
    // Object.assign(this, init)
    this.args = init.args
    this.author = init.author
    this.bot = init.bot
    this.channel = init.channel
    this.guild = init.guild
    this.interaction = init.interaction
    this.isInteraction = init.isInteraction
    this.member = init.member
    this.permissions = init.permissions
    this.prefix = init.prefix
    this.route = init.route
    this.routerStats = init.routerStats
    this.trackedMessage = init.trackedMessage
    this.user = init.user
  }

  public $render<T>(key: string, data?: T): string
  public $render<T>(locale: string, key: string, data?: T): string
  public $render<T>(locale: string, key?: string | T, data?: T): string {
    // When a locale override is passed too
    if (typeof locale === 'string' && typeof key === 'string') {
      return this.bot.Localization.$render(locale, key as string, Object.assign({}, data, { prefix: this.prefix }))
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

  public $sb<T>(baseString: string, data?: T) {
    return Utils.sb(baseString, Object.assign({}, data, { prefix: this.prefix }))
  }

  public async reply(response: string | MessagePayload | ReplyMessageOptions, ephemeral?: boolean) {
    try {
      if (typeof response === 'object') await (this.interaction as CommandInteraction).reply(Object.assign(response, { ephemeral }) as InteractionReplyOptions)
      else await (this.interaction as CommandInteraction).reply({ content: response, ephemeral })
    } catch (error) {
      this.bot.Log.Router.error('Unable to .reply =>', error, response)
      return false
    }
  }
}
