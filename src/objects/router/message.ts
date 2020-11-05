import * as XRegExp from 'xregexp'
import { RouteConfiguration, RouterRouted, Validate } from '@/router'

/**
 * Message routing configured to Object for use by the router
 * @export
 * @class MessageRoute
 */
export class MessageRoute {
  public readonly _defaultPermissions = {
    defaultEnabled: true,
    restricted: false,
    serverAdminOnly: false,
    restrictedTo: [],
    serverOnly: true,
    manageChannelReq: false
  }

  public category: string
  public command: string
  public controller: (routed: RouterRouted) => Promise<Boolean>
  public description: string
  public example: string
  public help: string
  public middleware: Array<(routed: RouterRouted) => Promise<RouterRouted | void>> = []
  public name: string
  public permissions: {
    defaultEnabled: boolean
    restricted: boolean
    serverAdminOnly: boolean
    restrictedTo: Array<string>
    serverOnly: boolean
    manageChannelReq: boolean
  }
  public type: 'message' | 'reaction'
  public validate: string
  public validation: Validate

  constructor(route: RouteConfiguration) {
    // Merge props from RouteConfiguration passed
    Object.assign(this, route)
    // Set command branch for sorting - only set this if the type is a message
    this.command = this.type === 'message' ? this.getCommand(route.validate) : undefined
    // Setup validation for route
    this.validation = new Validate(route.validate)
    // Ensure permissions is setup properly
    this.permissions = this._defaultPermissions
    Object.assign(this.permissions, route.permissions)
    // Restricted should override defaultEnabled
    this.permissions.defaultEnabled = this.permissions.restricted === true ? false : this.permissions.defaultEnabled
  }

  public test(message: string) {
    return this.validation.test(message)
  }

  private getCommand(str: string) {
    const regex = XRegExp('^\\/(?<name>[a-z0-9]*)', 'i')
    const match = XRegExp.exec(str, regex)
    return match['name']
  }
}
