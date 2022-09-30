/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RouteConfigurationCategory, RoutedInteraction } from '@/router'

import { Plugin } from '@/objects/plugin'
import { SlashCommandBuilder } from '@discordjs/builders'

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
  middleware?: Array<(routed: RoutedInteraction) => Promise<RoutedInteraction | void>>
  name: string
  permissions?: {
    defaultEnabled?: boolean
    restricted?: boolean
    serverAdminOnly?: boolean
    restrictedTo?: Array<string>
    serverOnly?: boolean
    manageChannelReq?: boolean,
    nsfwRequired?: boolean
  }
  plugin?: Plugin
  slash?: SlashCommandBuilder | Omit<any, any>
  type: 'message' | 'reaction' | 'interaction'
  validate?: string
  validateAlias?: Array<string>
}
