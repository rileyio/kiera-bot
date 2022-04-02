import * as XRegExp from 'xregexp'
import { RouteConfiguration, RouterRouted, Validate } from '@/router'
import { SlashCommandBuilder } from '@discordjs/builders'

/**
 * Message routing configured to Object for use by the router
 * @export
 * @class MessageRoute
 */
export class MessageRoute {
  public readonly _defaultPermissions = {
    defaultEnabled: true,
    manageChannelReq: false,
    restricted: false,
    restrictedTo: [],
    serverAdminOnly: false,
    serverOnly: true
  }

  public category: string
  public command: string
  public controller: (routed: RouterRouted) => Promise<boolean>
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
  public slash?: SlashCommandBuilder
  public type: 'message' | 'reaction' | 'interaction'
  public validate: string
  public validateAlias?: Array<string>
  public validation: Validate

  constructor(route: RouteConfiguration) {
    // Merge props from RouteConfiguration passed
    Object.assign(this, route)
    // Set command branch for sorting - only set this if the type is a message
    this.command = this.type === 'message' ? this.getCommand(route.validate) : undefined
    // Setup validation for route
    this.validation = this.type === 'message' ? new Validate(route.validate) : undefined
    // Ensure permissions is setup properly
    this.permissions = this._defaultPermissions
    Object.assign(this.permissions, route.permissions)
    // Restricted should override defaultEnabled
    this.permissions.defaultEnabled = this.permissions.restricted === true ? false : this.permissions.defaultEnabled
    // Ensure if the type is an interaction that the name is updated to match
    if (this.slash) this.name = this.slash.name
  }

  public test(message: string) {
    // Prevent error
    if (this.type !== 'message') throw new Error('Type is not "message", unable to .test(message: string)')
    if (this.validation.test(message)) {
      return {
        matched: true,
        validateSignature: this.validate
      }
    } else {
      if (this.validateAlias) {
        let aliasMatched = false
        let aliasFromMatch = ''
        // console.log('# of possible alias matches:', this.validateAlias.length)

        for (let index = 0; index < this.validateAlias.length; index++) {
          if (aliasMatched) continue
          const alias = this.validateAlias[index]
          const tempValidate = new Validate(alias)
          // console.log('testing alias', alias)
          // console.log('debug alias', tempValidate.test(message))
          if (tempValidate.test(message)) {
            aliasMatched = true
            aliasFromMatch = alias
          }
        }

        // console.log('alias matched', aliasMatched)
        if (aliasMatched)
          return {
            matched: aliasMatched,
            validateSignature: aliasFromMatch
          }
      }
    }

    // Fallback - failed
    return {
      matched: false,
      validateSignature: this.validate
    }
  }

  private getCommand(str: string) {
    const regex = XRegExp('^\\/(?<name>[a-z0-9]*)', 'i')
    const match = XRegExp.exec(str, regex)
    return match['name']
  }
}
