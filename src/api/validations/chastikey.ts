import * as joi from '@hapi/joi'

export namespace ChastiKey {
  export function lockeeFetch() {
    return joi
      .object()
      .keys({
        username: joi
          .string()
          .alphanum()
          .min(2)
          .max(24)
          .required()
      })
      .optional()
  }

  export function khLockees() {
    return joi
      .object()
      .keys({
        username: joi
          .string()
          .alphanum()
          .min(2)
          .max(24)
          .required()
      })
      .required()
  }

  export function search() {
    return joi
      .object()
      .keys({
        query: joi
          .string()
          .alphanum()
          .min(2)
          .max(32)
          .required()
      })
      .required()
  }
}
