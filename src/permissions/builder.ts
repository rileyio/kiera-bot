import { CommandPermissions, CommandPermissionsAllowed } from '../objects/permission';
import { MessageRoute } from '../utils';
import { Guild } from 'discord.js';

// export class DefaultPermissionsBuilder {
//   constructor() {

//   }
// }
export function buildSetOnInsert(permissionsBuilt: Array<CommandPermissions>) {
  return permissionsBuilt.map(p => { return { $setOnInsert: p } })
}

export function buildBasePermissions(server: Guild, routes: Array<MessageRoute>) {
  var permissions: Array<CommandPermissions> = []
  for (let index = 0; index < routes.length; index++) {
    const route = routes[index];

    /*
     * Generate some base permissions for channels
     */
    // Reduce down to just text channels for permissions
    const channelsToBuildBaseFor = server.channels.array().filter(s => s.type === 'text')
    // Empty array to hold the base permissions built
    var channelBasePermissions: Array<CommandPermissionsAllowed> = []
    // Loop through channels and setup their base permission
    for (let index = 0; index < channelsToBuildBaseFor.length; index++) {
      const channel = channelsToBuildBaseFor[index];
      channelBasePermissions.push(new CommandPermissionsAllowed({
        allow: route.permissions.defaultEnabled,
        name: channel.name,
        target: channel.id,
        type: 'channel'
      }))
    }

    const permission = new CommandPermissions({
      serverID: server.id,
      command: route.name,
      enabled: route.permissions.defaultEnabled,
      allowed: channelBasePermissions
    })

    // Push to array to export
    permissions.push(permission)
  }

  // Return build array
  return permissions
}