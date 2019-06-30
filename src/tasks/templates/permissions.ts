import { Task } from '../task';
import { CommandPermissions, CommandPermissionsAllowed } from '../../objects/permission';
import { ObjectID } from 'bson';
import { buildMissingPermissions, cleanupDuplicates } from '../../permissions/builder';

export class PermissionsChannelAdditions extends Task {
  public previousRefresh: number = 0
  
  name = 'PermissionsChannelAdditions'
  run = this.fetch
  isAsync = true
  frequency = 3600000 // every 1 hr

  // Methods for this task
  protected async fetch() {
    if ((Date.now() - this.previousRefresh) < this.frequency) return true // Block as its too soon
    // Get all permissions in DB (root level is by command's global status)
    var storedPermissions = await this.Bot.DB.getMultiple<CommandPermissions>('command-permissions', {})
    // Get currently servers currently using the bot & only look at those
    var botServers = this.Bot.client.guilds.array()
    // Loop through each permission by server and check sub channel list and that it contains
    // all currently available channels on that server
    // console.log('PermissionsChannelAdditions servers', botServers.map(bs => bs.name))
    for (let serverIndex = 0; serverIndex < botServers.length; serverIndex++) {
      const focusedGuild = botServers[serverIndex];
      console.log('### Task:PermissionsChannelAdditions guild', focusedGuild.name)

      // Reduce collection of storedPermissions to only connected servers currently
      var focusedGuildStoredPermissions = storedPermissions.filter(s => s.serverID === focusedGuild.id)

      for (let commandIndex = 0; commandIndex < focusedGuildStoredPermissions.length; commandIndex++) {
        const commandPermission = focusedGuildStoredPermissions[commandIndex];
        // Scan channels and ensure any missing are added
        const currentServerChannels = botServers.find(bs => bs.id === commandPermission.serverID).channels.array()
        // Only add missing ones
        var channelsNeedingCommands = currentServerChannels.filter(x =>
          x.type === 'text' && commandPermission.allowed.findIndex(y => y.target === x.id) === -1)
        // console.log('PermissionsChannelAdditions channelsNeedingCommands',
        // commandPermission.command,
        // channelsNeedingCommands.map(bd => bd.name),
        // channelsNeedingCommands.length)

        if (channelsNeedingCommands.length > 0) {
          // Build base permissions
          var newPermissionsContainer = []
          // Loop through channels and setup their base permission
          for (let cIndex = 0; cIndex < channelsNeedingCommands.length; cIndex++) {
            const channel = channelsNeedingCommands[cIndex];
            newPermissionsContainer.push(new CommandPermissionsAllowed({
              allow: commandPermission.enabled,
              name: channel.name,
              target: channel.id,
              type: 'channel'
            }))
          }

          // console.log('PermissionsChannelAdditions permissionsToAdd', newPermissionsContainer)
          // Update Command in DB
          await this.Bot.DB.update<CommandPermissions>('command-permissions',
            { _id: new ObjectID(commandPermission._id) },
            { $addToSet: { allowed: { $each: newPermissionsContainer } } },
            { atomic: true })
        }
      }
    }

    this.previousRefresh = Date.now()

    // Done
    return true

  }
}

export class PermissionsGlobalAdditions extends Task {
  public previousRefresh: number = 0

  name = 'PermissionsGlobalAdditions'
  run = this.fetch
  isAsync = true
  frequency = 3600000 // every 1 hr

  // Methods for this task
  protected async fetch() {
    if ((Date.now() - this.previousRefresh) < this.frequency) return true // Block as its too soon

    // Run utility to add build and add any missing permissions on each server the bot is
    // apart of
    const guilds = this.Bot.client.guilds.array()
    for (let index = 0; index < guilds.length; index++) {
      const guild = guilds[index];
      await buildMissingPermissions(this.Bot, guild)
    }

    this.previousRefresh = Date.now()

    // Done
    return true
  }
}

export class PermissionsGlobalCleanup extends Task {
  public previousRefresh: number = 0

  name = 'PermissionsGlobalCleanup'
  run = this.cleanup
  isAsync = true
  frequency = 6000 // every 1 hr

  protected async cleanup() {
    if ((Date.now() - this.previousRefresh) < this.frequency) return true // Block as its too soon

    await cleanupDuplicates(this.Bot)

    this.previousRefresh = Date.now()

    // Done
    return true
  }
}