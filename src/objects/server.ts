import { TrackedRole } from "./role";
import { TrackedEmoji } from "./emojis";
import { TrackedChannel } from "./channel";
import { Guild } from "discord.js";

function isTrackedServer(inc: TrackedServer | Guild): inc is TrackedServer {
  return Array.isArray((<TrackedServer>inc).channels);
}

export class TrackedServer {
  public _id: string
  public id: string
  public name: string
  public region: string
  public ownerID: string
  public memberCount: number
  public joinedTimestamp: number
  public emojis: Array<TrackedEmoji>
  public channels: Array<TrackedChannel>
  public roles: Array<TrackedRole>

  constructor(init: TrackedServer | Guild) {
    // Args being fussy, using 'arguments[]' to find
    var isTracked = isTrackedServer(init)
  
    Object.assign(this, {
      id: init.id,
      name: init.name,
      region: init.region,
      ownerID: init.ownerID,
      memberCount: init.memberCount,
      joinedTimestamp: init.joinedTimestamp,
      emojis: isTracked
        ? (<TrackedServer>init).emojis.map(emoji => new TrackedEmoji(emoji))
        : (<Guild>init).emojis.array().map(emoji => new TrackedEmoji(emoji)),
      channels: isTracked
        ? (<TrackedServer>init).channels.map(channel => new TrackedChannel(channel))
        : (<Guild>init).channels.array().map(channel => new TrackedChannel(channel)),
      roles: isTracked
        ? (<TrackedServer>init).roles.map(role => new TrackedRole(role))
        : (<Guild>init).roles.array().map(role => new TrackedRole(role))
    });
  }
}