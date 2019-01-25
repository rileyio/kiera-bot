import { CommandPermissions, CommandPermissionsAllowed } from '../objects/permission';

export namespace Permissions {
  export interface VerifyCommandPermissionsBuilderEnd {
    user?: string; channel?: string; role?: string;
  }

  export class VerifyCommandPermissionsBuilder {
    private readonly permissions: Array<CommandPermissions> = []
    private filtered: Array<CommandPermissions> = []

    constructor(permissions: Array<CommandPermissions>) {
      this.permissions = permissions
      this.filtered = this.permissions
    }

    public command(command: string) {
      this.filtered = this.filtered.filter(p => p.command === command)
      return this
    }

    public end(lookFor: VerifyCommandPermissionsBuilderEnd) {
      var allowed: boolean = true

      // Look through the filtered chain to find any matching
      for (let index = 0; index < this.filtered.length; index++) {
        const permission = this.filtered[index]
        // console.log('## Permission:', permission)

        // Update allowed
        allowed = permission.enabled

        // Check if there are any allows in `allowed` to verify
        const hasAllows = permission.allowed.length > 0

        // If there are allows, loop through
        if (hasAllows) { allowed = this.searchAllows(permission.allowed, lookFor, allowed) }
      }

      // Finished
      return allowed
    }

    private searchAllows(allows: Array<CommandPermissionsAllowed>, lookFor: VerifyCommandPermissionsBuilderEnd, currentlyAllow: boolean) {
      var userExceptionMatched = false
      var channelExceptionMatched = false
      var roleExceptionMatched = false
      var isAllowed = currentlyAllow

      for (let index = 0; index < allows.length; index++) {
        const _allow = allows[index];
        // Skip if allowed item does not match the current allow block
        if (_allow.type === 'channel' && _allow.target !== lookFor.channel) continue
        // Update allow set at first level 
        isAllowed = _allow.allow
        // Loop through exceptions
        // console.log('>> Exceptions length', _allow.exceptions.length)
        // console.log('>> Checking for', lookFor)
        // console.log('>> Currently:', isAllowed)
        for (let index = 0; index < _allow.exceptions.length; index++) {
          // If a match is found this cycle, end
          if (userExceptionMatched || channelExceptionMatched || roleExceptionMatched) break;

          const _exception = _allow.exceptions[index];
          // If the type is a user, then check the allow flag and update
          if (_exception.type === 'user' && _exception.target === lookFor.user) {
            userExceptionMatched = true
            isAllowed = _exception.allow
            // console.log('>> User Exception, isAllowed:', isAllowed)
          }
          // If type is a channel
          if (_exception.type === 'channel' && _exception.target === lookFor.channel) {
            channelExceptionMatched = true
            isAllowed = _exception.allow
            // console.log('>> Channel Exception, isAllowed:', isAllowed)
          }
          // If type is a role
          if (_exception.type === 'role' && _exception.target === lookFor.role) {
            roleExceptionMatched = true
            isAllowed = _exception.allow
            // console.log('>> Role Exception, isAllowed:', isAllowed)
          }
        }
      }

      // Priority always: user > channel > role
      if (userExceptionMatched) return isAllowed
      if (channelExceptionMatched) return isAllowed
      if (roleExceptionMatched) return isAllowed
      // Fallback
      return isAllowed
    }
  }

  export function VerifyCommandPermissions(permissions: Array<CommandPermissions>) {
    return new VerifyCommandPermissionsBuilder(permissions)
  }
}