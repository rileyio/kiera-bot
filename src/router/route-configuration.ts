/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { InteractionResponse, Message } from 'discord.js'

import { Plugin } from '@/objects/plugin'
import { RoutedInteraction } from '@/router'
import { SlashCommandBuilder } from '@discordjs/builders'

export type RouteConfigurationCategory =
  | ''
  | 'Admin'
  | 'BNet'
  | 'Fun'
  | 'Info'
  | 'Integration'
  | 'Managed'
  | 'Moderate'
  | 'Plugin'
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

export type RouteActionUserTarget = 'none' | 'author' | 'argument' | 'controller-decision'

/**
 * Discord Command Route
 *
 * @export
 * @interface RouteConfiguration
 */
export class RouteConfiguration {
  public category: RouteConfigurationCategory
  public controller: (routed: RoutedInteraction | Plugin, routedWhenPlugin?: RoutedInteraction) => Promise<InteractionResponse<boolean> | Message<boolean>>
  public description?: string
  public example?: string
  public help?: string
  public middleware?: Array<(routed: RoutedInteraction) => Promise<RoutedInteraction | void>>
  public name: string
  public permissions?: Partial<RouteConfigurationPermissions>
  public plugin?: Plugin
  public slash?: Partial<SlashCommandBuilder>
  public type: 'message' | 'reaction' | 'interaction'
  public validate?: string
  public validateAlias?: Array<string>

  constructor(route: Partial<RouteConfiguration>) {
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
}

export class RouteConfigurationPermissions {
  public defaultEnabled?: boolean = true
  public manageChannelReq?: boolean = false
  public nsfwRequired?: boolean = false
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
    this.restricted = permissions.restricted === undefined ? this.restricted : permissions.restricted
    this.restrictedToServer = permissions.restrictedToServer === undefined ? this.restrictedToServer : permissions.restrictedToServer
    this.restrictedToUser = permissions.restrictedToUser === undefined ? this.restrictedToUser : permissions.restrictedToUser
    this.serverAdminOnly = permissions.serverAdminOnly === undefined ? this.serverAdminOnly : permissions.serverAdminOnly
    this.serverOnly = permissions.serverOnly === undefined ? this.serverOnly : permissions.serverOnly

    // Restricted should override defaultEnabled
    this.defaultEnabled = this.restricted === true ? false : this.defaultEnabled
  }
}