/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { InteractionResponse, Message } from 'discord.js'
import { RouteConfigurationCategory, RoutedInteraction } from '@/router'

import { Plugin } from '@/objects/plugin'
import { SlashCommandBuilder } from '@discordjs/builders'

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
  public permissions?: RouteConfigurationPermissions
  public plugin?: Plugin
  public slash?: Partial<SlashCommandBuilder>
  public type: 'message' | 'reaction' | 'interaction'
  public validate?: string
  public validateAlias?: Array<string>

  constructor(route: RouteConfiguration) {
    this.category = route.category
    this.controller = route.controller
    this.description = route.description
    this.example = route.example
    this.middleware = route.middleware
    this.name = route.name
    this.permissions = new RouteConfigurationPermissions(route.permissions || {})
    this.plugin = route.plugin
    this.slash = route.slash
    this.type = route.type
    this.validate = route.validate
    this.validateAlias = route.validateAlias
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

  constructor(permissions: RouteConfigurationPermissions) {
    this.defaultEnabled = permissions.defaultEnabled
    this.manageChannelReq = permissions.manageChannelReq
    this.nsfwRequired = permissions.nsfwRequired
    this.restricted = permissions.restricted
    this.restrictedToServer = permissions.restrictedToServer
    this.restrictedToUser = permissions.restrictedToUser
    this.serverAdminOnly = permissions.serverAdminOnly
    this.serverOnly = permissions.serverOnly

    // Restricted should override defaultEnabled
    this.defaultEnabled = this.restricted === true ? false : this.defaultEnabled
  }
}
