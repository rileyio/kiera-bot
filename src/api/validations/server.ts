import * as joi from 'joi'

export namespace Server {
  export function getSettings() {
    return joi
      .object()
      .keys({
        serverID: joi.string().required()
      })
      .required()
  }
  export function updateSetting() {
    return joi
      .object()
      .keys({
        _id: joi.string().optional(),
        serverID: joi.string().required(),
        state: joi.bool(),
        value: joi.required()
      })
      .required()
  }
}
