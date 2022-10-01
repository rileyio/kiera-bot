import * as joi from 'joi'

export namespace Available {
  export function notifications() {
    return joi
      .object()
      .keys({
        serverID: joi.string().optional()
      })
      .optional()
  }
}
