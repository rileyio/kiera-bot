import * as joi from '@hapi/joi';

export namespace Available {
  export function notifications() {
    return joi.object().keys({
      serverID: joi.string().optional(),
    }).optional()
  }
}