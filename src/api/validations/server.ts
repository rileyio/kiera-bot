import * as joi from 'joi';

export namespace Server {
  export function getSettings() {
    return joi.object().keys({
      serverID: joi.string().required(),
    }).required()
  }
}