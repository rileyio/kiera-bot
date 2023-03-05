/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AcceptedResponse, Routed } from '@/router'
import { CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildMember, RESTPostAPIApplicationCommandsJSONBody, TextChannel } from 'discord.js'

import { Plugin } from '@/objects/plugin'

export type RouteConfigurationCategory =
  | ''
  | 'Admin'
  | 'BNet'
  | 'Fun'
  | 'Info'
  | `Integration/${string}`
  | 'Managed'
  | 'Moderate'
  | `Plugin/${string}`
  | 'Reddit'
  | 'Root'
  | 'Stats'
  | 'User'
  | 'Utility'

export interface ProcessedPermissions {
  // Permissions of user
  hasAdministrator: boolean
  hasManageChannel: boolean
  hasManageGuild: boolean
  // Checks
  outcome?: ProcessedPermissionOutcome
  // Bool state outcome
  pass?: boolean
}

export type ProcessedPermissionOutcome =
  | 'Pass'
  | 'FailedAdmin'
  | 'FailedIDCheck'
  | 'FailedNSFWRestriction'
  | 'FailedManageGuild'
  | 'FailedPermissionsCheck'
  | 'FailedServerOnlyRestriction'
  | 'FailedManageChannel'

export type RouteConfigurationType = {
  'discord-chat-interaction': {
    channel: TextChannel
    member: GuildMember
    options: Omit<CommandInteractionOptionResolver<CacheType>, 'getMessage' | 'getFocused'>
    type: ChatInputCommandInteraction<CacheType>
  }
  'placeolder-type': { channel: any; member: any; options: any; type: any }
}

/**
 * Discord Command Route
 *
 * @export
 * @interface RouteConfiguration
 */
export class RouteConfiguration<T extends keyof RouteConfigurationType> {
  public category: RouteConfigurationCategory
  public controller: (routed: Routed<T> | Plugin, routedWhenPlugin?: Routed<T>) => AcceptedResponse
  public description?: string
  public example?: string
  public help?: string
  public middleware?: Array<(routed: Routed<T>) => Promise<Routed<T> | void>>
  public name: string
  public permissions?: Partial<RouteConfigurationPermissions>
  public plugin?: Plugin
  /**
   * Discord Slash Command
   * @type {*}
   * @memberof RouteConfiguration
   */
  public slash?: any
  public type: keyof RouteConfigurationType
  public validate?: string
  public validateAlias?: Array<string>

  constructor(route: Partial<RouteConfiguration<RouteConfigurationType[T]['type']>>) {
    this.category = route.category
    this.controller = route.controller
    this.description = route.description
    this.example = route.example
    this.middleware = route.middleware === undefined ? [] : route.middleware
    this.name = route.name
    this.permissions = new RouteConfigurationPermissions(route.permissions || {})
    this.plugin = route.plugin
    this.slash = route.slash
    this.type = route.type
    this.validate = route.validate
    this.validateAlias = route.validateAlias

    // Make sure the route name is correctly matching whatever was specified in the slash command
    // for routing purposes
    this.name = this.slash?.name || this.name
  }

  public discordRegisterPayload() {
    return {
      nsfw: this.permissions.nsfwRequired,
      ...(this.slash.toJSON() as RESTPostAPIApplicationCommandsJSONBody)
    }
  }
}

export class RouteConfigurationPermissions {
  public defaultEnabled?: boolean = true
  public manageChannelReq?: boolean = false
  public nsfwRequired?: boolean = false
  public optInReq?: boolean = false
  public restricted?: boolean = false
  public restrictedToServer?: Array<string> = []
  public restrictedToUser?: Array<string> = []
  public serverAdminOnly?: boolean = false
  public serverOnly?: boolean = true

  public get hasLegacyServerRestriction(): boolean {
    return Array.isArray(this.restrictedToUser) ? this.restrictedToUser.length > 0 : false
  }

  constructor(permissions: Partial<RouteConfigurationPermissions>) {
    this.defaultEnabled = permissions.defaultEnabled === undefined ? this.defaultEnabled : permissions.defaultEnabled
    this.manageChannelReq = permissions.manageChannelReq === undefined ? this.manageChannelReq : permissions.manageChannelReq
    this.nsfwRequired = permissions.nsfwRequired === undefined ? this.nsfwRequired : permissions.nsfwRequired
    this.optInReq = permissions.optInReq === undefined ? this.optInReq : permissions.optInReq
    this.restricted = permissions.restricted === undefined ? this.restricted : permissions.restricted
    this.restrictedToServer = permissions.restrictedToServer === undefined ? this.restrictedToServer : permissions.restrictedToServer
    this.restrictedToUser = permissions.restrictedToUser === undefined ? this.restrictedToUser : permissions.restrictedToUser
    this.serverAdminOnly = permissions.serverAdminOnly === undefined ? this.serverAdminOnly : permissions.serverAdminOnly
    this.serverOnly = permissions.serverOnly === undefined ? this.serverOnly : permissions.serverOnly

    // Restricted should override defaultEnabled
    this.defaultEnabled = this.restricted === true ? false : this.defaultEnabled
  }
}
