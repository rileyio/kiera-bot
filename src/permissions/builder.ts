import { CommandPermissions, CommandPermissionsAllowed } from '../objects/permission';
import { MessageRoute } from '../utils';
import { Guild } from 'discord.js';
import { Bot } from '..';
import { ObjectID } from 'bson';

interface PermissionsDuplicates {
  _id: { _id: ObjectID, serverID: string }
  matches: Array<{ _id: ObjectID, serverID: string }>
  original: ObjectID
  count: number
}

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
}

// Duplicate cleaner
export async function cleanupDuplicates(bot: Bot) {
  const serverDuplicatePermissions = await bot.DB.aggregate<PermissionsDuplicates>('command-permissions', [
    // Only look at the current server// 
    //  { $match: { serverID: '473856867768991744' } },
    // { $match: { command: 'poll-edit' } },
    // Group together all matching entries by command name
    {
      $group: {
        _id: { _id: '$command', serverID: '$serverID' },
        // _id: '$command',
        matches: {
          $push: { _id: '$_id' }
        },
        original: { $first: '$_id' },
        count: { $sum: 1 },
      }
    },
    // Filter out only ones that contain dups
    { $match: { count: { '$gt': 1 } } },
  ])

  var toRemove = [] as Array<ObjectID>

  for (let index = 0; index < serverDuplicatePermissions.length; index++) {
    const permissionDup = serverDuplicatePermissions[index];

    for (let index = 0; index < permissionDup.matches.length; index++) {
      const permissionsMatch_id = permissionDup.matches[index];
      // Only add if its not the original to the Array of ObjectIDs to remove
      if (!permissionDup.original.equals(permissionsMatch_id._id)) {
        toRemove.push(permissionsMatch_id._id)
        bot.DEBUG_MSG_SCHEDULED.log(`Permissions -> Duplicate cleaner, ServerID: ${permissionsMatch_id.serverID}, _id: ${permissionsMatch_id._id.toHexString()}`)
      }
    }
  }

  await bot.DB.remove<any>('command-permissions', { _id: { $in: toRemove } }, { deleteOne: false })
}