import * as Utils from '@/utils'

import { CacheType, ChatInputCommandInteraction, Guild, InteractionReplyOptions, InteractionResponse, Message, MessagePayload, User } from 'discord.js'
import { ProcessedPermissions, RouteConfiguration, RouteConfigurationType, RouterStats } from '.'

import { Bot } from '@/index'
import { TrackedMessage } from '@/objects/message'
import { TrackedUser } from '@/objects/user/'

const DEFAULT_LOCALE = process.env.BOT_LOCALE

export type AcceptedResponse = Promise<InteractionResponse<boolean> | Message<boolean>>

/**
 * Routed Interaction
 * @export
 * @class Routed
 * @template InteractionType
 */
export class Routed<T extends keyof RouteConfigurationType> {
  private readonly prefix?: string = '/'

  public author: User
  public bot: Bot
  public channel: RouteConfigurationType[T]['channel']
  public guild?: Guild
  public interaction: RouteConfigurationType[T]['type']
  public isChatInputCommand?: boolean
  public member: RouteConfigurationType[T]['member']
  public options?: RouteConfigurationType[T]['options']
  public permissions?: ProcessedPermissions
  public route: RouteConfiguration<T>
  public routerStats: RouterStats
  public trackedMessage?: TrackedMessage
  public type?: 'interaction'
  public user: TrackedUser

  constructor(init: Omit<Routed<T>, '$render' | '$locales' | '$sb' | '$localeExists' | 'reply' | 'followUp'>) {
    this.author = init.author
    this.bot = init.bot
    this.channel = init.channel
    this.guild = init.guild
    this.interaction = init.interaction
    this.isChatInputCommand = init.isChatInputCommand
    this.member = init.member
    this.options = init.options
    this.permissions = init.permissions
    this.route = init.route
    this.routerStats = init.routerStats
    this.trackedMessage = init.trackedMessage
    this.user = init.user
  }

  /**
   * Get the contributors of a locale
   * @private
   * @param {string} locale Locale to get contributors of
   * @return {string} Locale contributors string
   * @memberof Routed
   */
  private $localeContributors(locale: string): string {
    return (this.bot.Localization.$localeContributors(locale) as string) || ''
  }

  /**
   * Render template string from the i18n file
   * @template T
   * @param {string} key String lookup by dot notation (e.g. 'command.ping.description')
   * @param {T} [data] Optional Data to pass to the template
   * @return {string} Rendered string
   * @memberof Routed
   */
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

  /**
   * Check if a locale exists
   * @param {string} key
   * @return {*}  {boolean}
   * @memberof Routed
   */
  public $localeExists(key: string): boolean {
    return this.bot.Localization.$localeExists(key)
  }

  /**
   * Get the currently available locales
   * @return {string}
   * @memberof Routed
   */
  public $locales(): string {
    return this.bot.Localization.$locales()
  }

  /**
   * String builder (take template string and data, return rendered string)
   *
   * Example String:
   * ```handlebars
   * Hello, {name}!
   * This is a test string.
   * ```
   *
   * Example Data:
   * ```js
   * {
   *   name: 'Emma'
   * }
   * ```
   *
   * @template T Data type
   * @param {string} baseString Template string
   * @param {T} [data] Optional data to pass to the template
   * @return {string} Rendered string
   * @memberof Routed
   */
  public $sb<T>(baseString: string, data?: T): string {
    return Utils.sb(baseString, Object.assign({}, data, { prefix: this.prefix }))
  }

  /**
   * Reply to the interaction
   * @param {(string | MessagePayload | InteractionReplyOptions)} response Response to send
   * @param {boolean} [ephemeral] Whether the response should be ephemeral
   * @return {Promise<InteractionResponse<boolean>>}
   * @memberof Routed
   */
  public async reply(response: string | MessagePayload | InteractionReplyOptions, ephemeral?: boolean): Promise<InteractionResponse<boolean>> {
    // const isObj = optionsOrPrivate ? typeof optionsOrPrivate === 'object' : false
    // const ephemeral = isObj ? (optionsOrPrivate as ReplyOptions).ephemeral : (optionsOrPrivate as boolean)
    try {
      if (typeof response === 'object') return await (this.interaction as ChatInputCommandInteraction<CacheType>).reply(Object.assign(response, { ephemeral }))
      else return await (this.interaction as ChatInputCommandInteraction<CacheType>).reply({ content: response, ephemeral } as string | MessagePayload | InteractionReplyOptions)
    } catch (error) {
      this.bot.Log.Router.error('Unable to .reply =>', error, response)
    }
  }

  public async followUp(response: string | MessagePayload | InteractionReplyOptions, ephemeral?: boolean) {
    return await (this.interaction as ChatInputCommandInteraction<CacheType>).followUp({ content: response, ephemeral } as string | MessagePayload | InteractionReplyOptions)
  }
}
