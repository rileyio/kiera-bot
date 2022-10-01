import * as joi from 'joi'

export namespace Permissions {
  export function getAll() {
    return joi
      .object()
      .keys({
        serverID: joi
          .string()
          .alphanum()
          .required()
      })
      .required()
  }
  export function get() {
    return joi
      .object()
      .keys({
        id: joi
          .string()
          .alphanum()
          .min(24)
          .max(24)
          .required()
      })
      .required()
  }
  export function updateGlobal() {
    return joi
      .object()
      .keys({
        _id: joi
          .string()
          .alphanum()
          .min(24)
          .max(24)
          .required(),
        serverID: joi.string().required(),
        state: joi.boolean().required()
      })
      .required()
  }
  export function deleteGlobal() {
    return joi
      .object()
      .keys({
        _id: joi
          .string()
          .alphanum()
          .min(24)
          .max(24)
          .required(),
        serverID: joi.string().required()
      })
      .required()
  }
  export function updateAllowed() {
    return joi
      .object()
      .keys({
        _id: joi
          .string()
          .alphanum()
          .min(24)
          .max(24)
          .required(),
        serverID: joi.string().required(),
        command: joi.string().required(),
        target: joi.string().required(),
        state: joi.boolean().required()
      })
      .required()
  }
}
