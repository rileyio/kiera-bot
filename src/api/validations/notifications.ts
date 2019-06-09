import * as joi from '@hapi/joi';

export namespace Notifications {
  export function get() {
    return joi.object().keys({
      serverID: joi.string().required(),
    }).required()
  }
  export function update() {
    return joi.object().keys({
      authorID: joi.string().required(),
      serverID: joi.string().required(),
      owner: joi.string().optional(),
      name: joi.string().required(),
      where: joi.string().required(),
      state: joi.boolean().required()
    }).required()
  }
}