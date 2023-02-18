import * as Utils from '@/utils'

import {
  CacheType,
  Channel,
  ChatInputCommandInteraction,
  CommandInteractionOptionResolver,
  Guild,
  GuildMember,
  InteractionReplyOptions,
  MessagePayload,
  TextChannel,
  User
} from 'discord.js'
import { MessageRoute, ProcessedPermissions, RouterStats } from '@/router'

import { Bot } from '@/index'
import { TrackedMessage } from '@/objects/message'
import { TrackedUser } from '@/objects/user/'

const DEFAULT_LOCALE = process.env.BOT_LOCALE

export class RoutedInteraction {
  public author: User
  public bot: Bot
  public channel: Channel | TextChannel
  public guild: Guild
  public interaction: ChatInputCommandInteraction
  public isChatInputCommand?: boolean
  public isInteraction: boolean
  public member: GuildMember
  public options?: Omit<CommandInteractionOptionResolver<CacheType>, 'getMessage' | 'getFocused'>
  public permissions: ProcessedPermissions
  public prefix: string
  public route: MessageRoute
  public routerStats: RouterStats
  public trackedMessage: TrackedMessage
  public type: 'interaction'
  public user: TrackedUser

  constructor(init: Partial<RoutedInteraction>) {
    this.author = init.author
    this.bot = init.bot
    this.channel = init.channel
    this.guild = init.guild
    this.interaction = init.interaction
    this.isChatInputCommand = init.isChatInputCommand
    this.isInteraction = init.isInteraction
    this.member = init.member
    this.options = init.options
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

  public async reply(response: string | MessagePayload | InteractionReplyOptions, ephemeral?: boolean) {
    // const isObj = optionsOrPrivate ? typeof optionsOrPrivate === 'object' : false
    // const ephemeral = isObj ? (optionsOrPrivate as ReplyOptions).ephemeral : (optionsOrPrivate as boolean)
    try {
      if (typeof response === 'object') return await (this.interaction as ChatInputCommandInteraction<CacheType>).reply(Object.assign(response, { ephemeral }))
      else return await (this.interaction as ChatInputCommandInteraction<CacheType>).reply({ content: response, ephemeral } as string | MessagePayload | InteractionReplyOptions)
    } catch (error) {
      this.bot.Log.Router.error('Unable to .reply =>', error, response)
    }
  }
}
