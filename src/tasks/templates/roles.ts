import { Task } from '../task';
import { CommandPermissions, CommandPermissionsAllowed } from '../../objects/permission';
import { ObjectID } from 'bson';

export class ChastiKeyDiscordRoles extends Task {
  name = 'ChastiKeyDiscordRoles'
  run = this.fetch
  isAsync = true
  frequency = 15000 // Once a day

  // Methods for this task
  protected async fetch() {


    return true

  }
}