import { CommandPermissions, CommandPermissionsAllowed } from '../objects/permission';
import { MessageRoute } from '../utils';
import { Guild } from 'discord.js';
import { Bot } from '..';

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

export async function buildMissingPermissions(bot: Bot, guild: Guild) {
  // Build base permissions
  const basePermissions = buildBasePermissions(guild, bot.Router.routes)
  // Get base permissions count from the db
  const basePermissionsStored = await bot.DB.getMultiple<CommandPermissions>('command-permissions', { serverID: guild.id })
  // Check count of base permissions
  const basePermissionsCount = basePermissions.length
  const basePermissionsStoredCount = basePermissionsStored.length

  bot.DEBUG.log('Permissions -> basePermissionsCount', guild.name, basePermissionsCount)
  bot.DEBUG.log('Permissions -> basePermissionsStoredCount', guild.name, basePermissionsStoredCount)

  if (basePermissionsStoredCount === 0) {
    await bot.DB.addMany('command-permissions', buildBasePermissions(guild, bot.Router.routes))
    bot.DEBUG.log('Permissions -> diff', guild.name, bot.Router.routes.length)
  }
  else {
    // Only add missing ones
    const baseDiff = basePermissions.filter(x => basePermissionsStored.findIndex(y => y.command === x.command) === -1)
    bot.DEBUG.log('Permissions -> diff', guild.name, baseDiff.length)
    if (baseDiff.length > 0) await bot.DB.addMany('command-permissions', baseDiff)
  }

  // Duplicate cleaner
  
}