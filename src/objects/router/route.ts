import { RouteConfigurationCategory, RouterRouted } from '@/router'
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
  slash?: SlashCommandBuilder | Omit<any, any>
  type: 'message' | 'reaction' | 'interaction'
  validate?: string
  validateAlias?: Array<string>
}
